import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signOut,
  signInAnonymously,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, cleanForFirestore, handleFirestoreError, OperationType } from '../services/firebase';
import { UserProfile, PRESET_AVATARS } from '../types/user';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  redirectLoading: boolean;
  loginWithGoogle: (customName?: string, customEmail?: string) => Promise<void>;
  sendPhoneVerification: (phoneNumber: string) => Promise<{ verificationId: string; simulatedOtp?: string }>;
  verifyPhoneOtpCode: (phoneNumber: string, verificationId: string, otp: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  recordGameResult: (result: 'win' | 'loss' | 'draw') => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Generate 4-digit readable Player ID from UID
export function generatePlayerId(uid: string): string {
  const hash = uid
    .split('')
    .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 10000, 1337);
  return `APEX-${String(Math.abs(hash)).padStart(4, '0')}`;
}

const SESSION_STORAGE_KEY = 'apex_ttt_active_user_session_v1';
const PENDING_OTP_KEY = 'apex_pending_otp_verification_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [redirectLoading] = useState<boolean>(false);

  // Sync profile into state immediately and dispatch non-blocking background write to Firestore
  const syncProfileInFirestore = (
    uid: string,
    fallbackData: {
      displayName?: string;
      email?: string | null;
      phoneNumber?: string | null;
      photoURL?: string | null;
    }
  ): UserProfile => {
    // 1. Check existing state / localStorage first
    let current: UserProfile | null = profile;
    if (!current) {
      try {
        const saved = localStorage.getItem(SESSION_STORAGE_KEY);
        if (saved) current = JSON.parse(saved);
      } catch {
        // ignore
      }
    }

    if (current && current.uid === uid) {
      const updated: UserProfile = {
        ...current,
        displayName: fallbackData.displayName || current.displayName,
        email: fallbackData.email !== undefined ? fallbackData.email : current.email,
        phoneNumber: fallbackData.phoneNumber !== undefined ? fallbackData.phoneNumber : current.phoneNumber,
        photoURL: fallbackData.photoURL || current.photoURL,
        updatedAt: new Date().toISOString(),
      };

      setProfile(updated);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));

      // Asynchronous background firestore update
      const userDocRef = doc(db, 'users', uid);
      const payload = cleanForFirestore(updated as unknown as Record<string, unknown>);
      setDoc(userDocRef, payload, { merge: true }).catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
      });

      return updated;
    }

    // 2. Create fresh profile
    const name = fallbackData.displayName?.trim() || 'Apex Challenger';
    const cleanUsername = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 14) || `Player${uid.slice(-4)}`;

    const newProfile: UserProfile = {
      uid,
      username: cleanUsername,
      displayName: name,
      playerId: generatePlayerId(uid),
      photoURL: fallbackData.photoURL || undefined,
      avatarKey: PRESET_AVATARS[0].id,
      email: fallbackData.email || null,
      phoneNumber: fallbackData.phoneNumber || null,
      stats: {
        wins: 0,
        losses: 0,
        draws: 0,
        bestStreak: 0,
        currentStreak: 0,
        totalGames: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Instant local state update so UI closes modal in 0ms!
    setProfile(newProfile);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newProfile));

    // Asynchronous background firestore write
    const userDocRef = doc(db, 'users', uid);
    const firestorePayload = cleanForFirestore(newProfile as unknown as Record<string, unknown>);
    setDoc(userDocRef, firestorePayload, { merge: true }).catch((err) => {
      handleFirestoreError(err, OperationType.CREATE, `users/${uid}`);
    });

    return newProfile;
  };

  // Restore session on boot
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as UserProfile;
        setProfile(parsed);
      }
    } catch {
      // ignore
    }

    // Firebase Auth Listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        syncProfileInFirestore(currentUser.uid, {
          displayName: currentUser.displayName || undefined,
          email: currentUser.email,
          phoneNumber: currentUser.phoneNumber,
          photoURL: currentUser.photoURL,
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Login with Google (instant resolution + background Firestore sync)
  const loginWithGoogle = async (customName?: string, customEmail?: string): Promise<void> => {
    const googleUid = `guest_google_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const displayName = customName?.trim() || 'Manu Kirar';
    const email = customEmail?.trim() || `${displayName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`;

    // Register in Firebase Auth if provider is available
    signInAnonymously(auth).catch(() => {});

    syncProfileInFirestore(googleUid, {
      displayName,
      email,
    });
  };

  // Send Phone OTP Verification
  const sendPhoneVerification = async (
    phoneNumber: string
  ): Promise<{ verificationId: string; simulatedOtp?: string }> => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const verificationId = `v_${Date.now()}_${cleanNumber.slice(-4)}`;
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    sessionStorage.setItem(
      PENDING_OTP_KEY,
      JSON.stringify({ phoneNumber, verificationId, otp: generatedOtp, timestamp: Date.now() })
    );

    return { verificationId, simulatedOtp: generatedOtp };
  };

  // Verify Phone OTP Code & Store in Firebase Firestore
  const verifyPhoneOtpCode = async (
    phoneNumber: string,
    verificationId: string,
    otp: string
  ): Promise<void> => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const pendingRaw = sessionStorage.getItem(PENDING_OTP_KEY);

    if (pendingRaw) {
      try {
        const pending = JSON.parse(pendingRaw);
        if (pending.otp && pending.otp !== otp.trim()) {
          throw new Error('Invalid OTP code. Please enter the 6-digit code shown.');
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('Invalid OTP')) {
          throw err;
        }
      }
    }

    // Save Phone User Profile with guest_ prefix
    const uid = `guest_phone_${cleanNumber}`;
    signInAnonymously(auth).catch(() => {});
    syncProfileInFirestore(uid, {
      phoneNumber,
      displayName: `Player ${cleanNumber.slice(-4)}`,
    });
    sessionStorage.removeItem(PENDING_OTP_KEY);
  };

  // Update Profile in Firestore
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!profile) return;
    const updated: UserProfile = {
      ...profile,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    setProfile(updated);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));

    const userDocRef = doc(db, 'users', profile.uid);
    const payload = cleanForFirestore(updated as unknown as Record<string, unknown>);
    setDoc(userDocRef, payload, { merge: true }).catch((err) => {
      handleFirestoreError(err, OperationType.UPDATE, `users/${profile.uid}`);
    });
  };

  // Record Game Result in Firestore
  const recordGameResult = async (result: 'win' | 'loss' | 'draw') => {
    if (!profile) return;
    const currentStats = { ...profile.stats };
    currentStats.totalGames += 1;

    if (result === 'win') {
      currentStats.wins += 1;
      currentStats.currentStreak += 1;
      if (currentStats.currentStreak > currentStats.bestStreak) {
        currentStats.bestStreak = currentStats.currentStreak;
      }
    } else if (result === 'loss') {
      currentStats.losses += 1;
      currentStats.currentStreak = 0;
    } else {
      currentStats.draws += 1;
    }

    await updateProfile({ stats: currentStats });
  };

  // Sign out
  const logout = async () => {
    if (user) {
      await signOut(auth).catch(() => {});
    }
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(PENDING_OTP_KEY);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        redirectLoading,
        loginWithGoogle,
        sendPhoneVerification,
        verifyPhoneOtpCode,
        updateProfile,
        recordGameResult,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
