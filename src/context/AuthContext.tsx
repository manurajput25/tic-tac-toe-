import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
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
  loginWithGoogle: () => Promise<void>;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch or initialize user profile in Firestore
  const fetchOrCreateProfile = async (firebaseUser: User) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      } else {
        // Generate new default profile
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

        await setDoc(userDocRef, newProfile);
        setProfile(newProfile);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchOrCreateProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Google Login
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
    if (!user || !profile) return;
    const userDocRef = doc(db, 'users', user.uid);
    const updated = {
      ...profile,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    try {
      await updateDoc(userDocRef, updated);
      setProfile(updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  // Record Game Result
  const recordGameResult = async (result: 'win' | 'loss' | 'draw') => {
    if (!user || !profile) return;
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
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        loginWithGoogle,
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
