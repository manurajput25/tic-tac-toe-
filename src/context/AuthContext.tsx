import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../services/firebase';
import { UserProfile, PRESET_AVATARS } from '../types/user';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  redirectLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithGoogleRedirect: () => Promise<void>;
  loginAsGuest: (username?: string, phoneNumber?: string) => Promise<void>;
  setupRecaptcha: (containerId: string) => RecaptchaVerifier;
  sendPhoneOtp: (phoneNumber: string, appVerifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  verifyPhoneOtp: (confirmationResult: ConfirmationResult, otp: string) => Promise<void>;
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

// Generate 4-digit readable Player ID
export function generatePlayerId(uid: string): string {
  const hash = uid
    .split('')
    .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 10000, 1337);
  return `APEX-${String(Math.abs(hash)).padStart(4, '0')}`;
}

const GUEST_STORAGE_KEY = 'apex_ttt_guest_profile_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [redirectLoading, setRedirectLoading] = useState<boolean>(() => {
    return (
      typeof window !== 'undefined' &&
      sessionStorage.getItem('apex_redirect_login_in_progress') === 'true'
    );
  });

  // Fetch or initialize user profile in Firestore
  const fetchOrCreateProfile = async (firebaseUser: User) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const p = snap.data() as UserProfile;
        setProfile(p);
        localStorage.removeItem(GUEST_STORAGE_KEY);
      } else {
        const defaultUsername =
          firebaseUser.displayName?.replace(/\s+/g, '').slice(0, 15) ||
          `Player${firebaseUser.uid.slice(0, 5)}`;

        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          username: defaultUsername,
          displayName: firebaseUser.displayName || 'Apex Challenger',
          playerId: generatePlayerId(firebaseUser.uid),
          photoURL: firebaseUser.photoURL || undefined,
          avatarKey: PRESET_AVATARS[0].id,
          email: firebaseUser.email || null,
          phoneNumber: firebaseUser.phoneNumber || null,
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

        await setDoc(userDocRef, newProfile).catch((e) => {
          console.warn('Could not save profile to firestore:', e);
        });
        setProfile(newProfile);
        localStorage.removeItem(GUEST_STORAGE_KEY);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
    }
  };

  useEffect(() => {
    // Check if returning from redirect login (mobile)
    getRedirectResult(auth)
      .then(async (result) => {
        sessionStorage.removeItem('apex_redirect_login_in_progress');
        setRedirectLoading(false);
        if (result && result.user) {
          await fetchOrCreateProfile(result.user);
        }
      })
      .catch((err) => {
        sessionStorage.removeItem('apex_redirect_login_in_progress');
        setRedirectLoading(false);
        console.warn('Redirect sign-in check:', err);
      });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchOrCreateProfile(currentUser);
      } else {
        // Fallback to local guest profile if saved
        try {
          const saved = localStorage.getItem(GUEST_STORAGE_KEY);
          if (saved) {
            setProfile(JSON.parse(saved));
          } else {
            setProfile(null);
          }
        } catch {
          setProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Google Login via Popup
  const loginWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        await fetchOrCreateProfile(res.user);
      }
    } catch (error) {
      console.error('Google Sign-in failed', error);
      throw error;
    }
  };

  // Google Login via Full Page Redirect (Solves mobile popup blocker completely)
  const loginWithGoogleRedirect = async () => {
    try {
      sessionStorage.setItem('apex_redirect_login_in_progress', 'true');
      setRedirectLoading(true);
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      sessionStorage.removeItem('apex_redirect_login_in_progress');
      setRedirectLoading(false);
      console.error('Google Redirect Sign-in failed', error);
      throw error;
    }
  };

  // Guest / Instant Profile (Enables immediate username & online multiplayer play on any domain)
  const loginAsGuest = async (customUsername?: string, phoneNum?: string) => {
    const guestUid = `guest_${Math.random().toString(36).substring(2, 10)}`;
    const cleanUsername = customUsername?.trim() || `Challenger_${Math.floor(1000 + Math.random() * 9000)}`;

    const newProfile: UserProfile = {
      uid: guestUid,
      username: cleanUsername,
      displayName: cleanUsername,
      playerId: generatePlayerId(guestUid),
      avatarKey: PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)].id,
      email: null,
      phoneNumber: phoneNum || null,
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

    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(newProfile));
    setProfile(newProfile);

    // Save to Firestore so other online players can read their name/avatar
    try {
      const docRef = doc(db, 'users', guestUid);
      await setDoc(docRef, newProfile).catch(() => {});
    } catch {
      // ignore
    }
  };

  // Setup reCAPTCHA verifier for Phone Auth
  const setupRecaptcha = (containerId: string): RecaptchaVerifier => {
    return new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        console.warn('reCAPTCHA expired, please try again.');
      },
    });
  };

  // Send Phone OTP
  const sendPhoneOtp = async (
    phoneNumber: string,
    appVerifier: RecaptchaVerifier
  ): Promise<ConfirmationResult> => {
    try {
      return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    } catch (error) {
      console.error('Failed to send phone OTP', error);
      throw error;
    }
  };

  // Confirm Phone OTP
  const verifyPhoneOtp = async (confirmationResult: ConfirmationResult, otp: string) => {
    try {
      const cred = await confirmationResult.confirm(otp);
      if (cred.user) {
        await fetchOrCreateProfile(cred.user);
      }
    } catch (error) {
      console.error('Invalid OTP', error);
      throw error;
    }
  };

  // Update Profile
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!profile) return;
    const updated: UserProfile = {
      ...profile,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    setProfile(updated);

    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      try {
        await updateDoc(userDocRef, updated as unknown as Record<string, unknown>);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    } else {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updated));
      try {
        const userDocRef = doc(db, 'users', profile.uid);
        await setDoc(userDocRef, updated).catch(() => {});
      } catch {
        // ignore
      }
    }
  };

  // Record Game Result
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
      await signOut(auth);
    }
    localStorage.removeItem(GUEST_STORAGE_KEY);
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
        loginWithGoogleRedirect,
        loginAsGuest,
        setupRecaptcha,
        sendPhoneOtp,
        verifyPhoneOtp,
        updateProfile,
        recordGameResult,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
