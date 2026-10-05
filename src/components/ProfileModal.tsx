import React, { useState } from 'react';
import { UserProfile } from '../types/game';
import {
  AVATAR_PRESETS,
  saveProfileToFirestore,
  sendEmailVerificationCode,
  verifyAndRegisterEmailAccount,
  loginWithEmail,
  logoutUser,
  checkEmailRegistered,
} from '../utils/firebase';
import { sound } from '../utils/audio';
import {
  X,
  User,
  Trophy,
  Flame,
  Check,
  ShieldCheck,
  LogIn,
  LogOut,
  Mail,
  Lock,
  Palette,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface ProfileModalProps {
  currentProfile: UserProfile | null;
  onSaveProfile: (profile: UserProfile) => void;
  onOpenPaletteStudio?: () => void;
  onClose: () => void;
}

const TITLES = [
  'Arena Tactician',
  'Grandmaster',
  'Quantum Striker',
  'Cyber Duelist',
  'Mastermind',
  'Apex Contender',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  currentProfile,
  onSaveProfile,
  onOpenPaletteStudio,
  onClose,
}) => {
  // Gamer Profile Customization State
  const [displayName, setDisplayName] = useState<string>(
    currentProfile?.displayName || 'Apex Player'
  );
  const [username, setUsername] = useState<string>(
    currentProfile?.username || `apex_${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [selectedAvatar, setSelectedAvatar] = useState<string>(
    currentProfile?.avatar || AVATAR_PRESETS[0].id
  );
  const [selectedTitle, setSelectedTitle] = useState<string>(
    currentProfile?.title || TITLES[0]
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Authentication State
  const isCurrentlyLoggedIn = Boolean(currentProfile?.email && currentProfile?.isVerified);
  const [authMode, setAuthMode] = useState<'create_account' | 'login'>(
    isCurrentlyLoggedIn ? 'login' : 'create_account'
  );
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [isCodeSent, setIsCodeSent] = useState<boolean>(false);
  const [simulatedCodeHelper, setSimulatedCodeHelper] = useState<string | null>(null);
  const [accountCreatedSuccess, setAccountCreatedSuccess] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const activeAvatar =
    AVATAR_PRESETS.find((a) => a.id === selectedAvatar) || AVATAR_PRESETS[0];

  // 1. Send Verification Code (Only for new accounts - "ek email se ek hi account bane")
  const handleSendVerificationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = authEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setAuthError('Please enter a valid email address');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      // Rule: "ek email se ek hi account bane"
      const alreadyExists = await checkEmailRegistered(cleanEmail);
      if (alreadyExists) {
        setAuthError('An account with this email already exists! Please switch to "Log In".');
        setAuthLoading(false);
        return;
      }

      const res = await sendEmailVerificationCode(
        cleanEmail,
        displayName.trim() || cleanEmail.split('@')[0],
        username.trim() || cleanEmail.split('@')[0],
        selectedAvatar,
        authPassword
      );

      setIsCodeSent(true);
      setSimulatedCodeHelper(res.code || null);
      setAuthSuccess(`Verification code sent to ${cleanEmail}`);
      sound.playClick();
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Failed to send verification code');
    } finally {
      setAuthLoading(false);
    }
  };

  // 2. Verify Code & Complete Registration
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = verificationCode.trim();
    if (cleanCode.length !== 6) {
      setAuthError('Please enter the complete 6-digit verification code');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await verifyAndRegisterEmailAccount(authEmail.trim(), cleanCode);
      setAccountCreatedSuccess(true);
      setAuthSuccess('your account has been created sucessfully');
      sound.playWin();

      // Update app state with verified profile
      onSaveProfile(res.profile);
      setDisplayName(res.profile.displayName);
      setUsername(res.profile.username);
      setSelectedAvatar(res.profile.avatar);
      setSelectedTitle(res.profile.title || TITLES[0]);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Invalid verification code');
    } finally {
      setAuthLoading(false);
    }
  };

  // 3. Log In to Existing Account
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = authEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthError('Please enter your registered email address');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const res = await loginWithEmail(cleanEmail, authPassword);
      sound.playWin();
      setAuthSuccess(`Welcome back, ${res.profile.displayName}!`);

      // Update app profile
      onSaveProfile(res.profile);
      setDisplayName(res.profile.displayName);
      setUsername(res.profile.username);
      setSelectedAvatar(res.profile.avatar);
      setSelectedTitle(res.profile.title || TITLES[0]);
      setTimeout(() => setAuthSuccess(null), 3000);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Login failed. Check your email and password.');
    } finally {
      setAuthLoading(false);
    }
  };

  // 4. Log Out
  const handleLogout = async () => {
    setAuthLoading(true);
    try {
      const guestProfile = await logoutUser();
      sound.playClick();
      onSaveProfile(guestProfile);
      setDisplayName(guestProfile.displayName);
      setUsername(guestProfile.username);
      setSelectedAvatar(guestProfile.avatar);
      setAuthEmail('');
      setAuthPassword('');
      setIsCodeSent(false);
      setAccountCreatedSuccess(false);
      setAuthSuccess('Logged out successfully');
      setTimeout(() => setAuthSuccess(null), 2500);
    } catch (err) {
      console.warn('Logout notice:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  // 5. Save Profile Details (Name, Avatar, Title) to Firestore
  const handleSaveProfileDetails = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!displayName.trim()) {
      setAuthError('Please enter a display name');
      return;
    }
    if (!username.trim()) {
      setAuthError('Please enter a gamer handle');
      return;
    }

    setIsSaving(true);
    setAuthError(null);
    try {
      const uid = currentProfile?.uid || `anon_${Date.now()}`;
      const updatedProfile: UserProfile = {
        uid,
        displayName: displayName.trim().slice(0, 24),
        username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20),
        avatar: selectedAvatar,
        title: selectedTitle,
        email: currentProfile?.email || null,
        isVerified: currentProfile?.isVerified || false,
        totalGames: currentProfile?.totalGames || 0,
        wins: currentProfile?.wins || 0,
        losses: currentProfile?.losses || 0,
        draws: currentProfile?.draws || 0,
        bestStreak: currentProfile?.bestStreak || 0,
        customPalettes: currentProfile?.customPalettes || [],
        activePaletteId: currentProfile?.activePaletteId || null,
        createdAt: currentProfile?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveProfileToFirestore(updatedProfile);
      sound.playClick();
      onSaveProfile(updatedProfile);
      onClose();
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Gamer Profile and Account"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xl animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="relative w-full max-w-lg my-auto p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl text-slate-900 dark:text-slate-100 overflow-hidden">
        {/* Top ambient highlight */}
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500 shadow-sm">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                {isCurrentlyLoggedIn ? 'Gamer Profile & Account' : 'Account & Gamer Profile'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Persistent cloud records & multiplayer identification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Notifications */}
        {authSuccess && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{authSuccess}</span>
          </div>
        )}

        {authError && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* Live Identity Card Banner */}
        <div className="mb-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 text-white shadow-lg relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3.5 relative z-10">
            {/* Avatar preview */}
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${activeAvatar.gradient} flex items-center justify-center text-xl sm:text-2xl shadow-lg border-2 border-white/20 shrink-0`}
            >
              <span>{activeAvatar.emoji}</span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display font-extrabold text-sm sm:text-base tracking-tight truncate text-white">
                  {displayName || 'Apex Player'}
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-[9px] font-bold text-cyan-300 uppercase tracking-wider shrink-0">
                  {selectedTitle}
                </span>
              </div>
              <div className="text-[11px] sm:text-xs text-slate-400 font-mono truncate">
                @{username.toLowerCase() || 'player'}
              </div>

              {/* Stats badges */}
              <div className="flex items-center gap-2.5 mt-1.5 text-[11px] text-slate-300">
                <span className="flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  <strong className="text-white">{currentProfile?.wins || 0}</strong> Wins
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-400" />
                  Streak <strong className="text-white">{currentProfile?.bestStreak || 0}x</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- SECTION 1: EMAIL ACCOUNT MANAGEMENT ---------------- */}
        <div className="mb-5 p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
          {isCurrentlyLoggedIn ? (
            /* Logged-In State with Logout Option */
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      Account Verified
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                    {currentProfile?.email}
                  </div>
                </div>
              </div>

              {/* LOGOUT OPTION */}
              <button
                type="button"
                disabled={authLoading}
                onClick={handleLogout}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500 border border-rose-500/30 rounded-xl transition-all cursor-pointer shrink-0 disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            /* Not Logged In: Create Account OR Log In */
            <div>
              {/* Segmented Auth Selector */}
              <div className="flex items-center gap-1 p-1 bg-slate-200/80 dark:bg-slate-900 rounded-xl mb-3">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setAuthMode('create_account');
                    setIsCodeSent(false);
                    setAuthError(null);
                    setAuthSuccess(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    authMode === 'create_account'
                      ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Create Account (1 per email)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setAuthMode('login');
                    setIsCodeSent(false);
                    setAuthError(null);
                    setAuthSuccess(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Log In
                </button>
              </div>

              {/* Mode 1: Create Account Flow */}
              {authMode === 'create_account' && (
                <div>
                  {!isCodeSent ? (
                    <form onSubmit={handleSendVerificationCode} className="space-y-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Email Address (1 account only)
                        </label>
                        <div className="relative">
                          <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                          <input
                            type="email"
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white font-mono"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Password (for future logins)
                        </label>
                        <div className="relative">
                          <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                          <input
                            type="password"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            placeholder="Create account password"
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>{authLoading ? 'Checking & Sending Code...' : 'Send Verification Code to Email'}</span>
                      </button>
                    </form>
                  ) : (
                    /* Step 2: Enter Verification Code */
                    <form onSubmit={handleVerifyCode} className="space-y-3 animate-in fade-in">
                      <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs">
                        <div className="font-bold text-cyan-600 dark:text-cyan-400 mb-1 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Verification Code Sent!</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                          We sent a 6-digit code to <strong>{authEmail}</strong>.
                        </p>
                        {simulatedCodeHelper && (
                          <div className="mt-2 p-2 rounded-lg bg-slate-900 text-cyan-300 text-[11px] font-mono flex items-center justify-between border border-cyan-500/40">
                            <span>Code: <strong className="tracking-widest text-white text-xs">{simulatedCodeHelper}</strong></span>
                            <button
                              type="button"
                              onClick={() => setVerificationCode(simulatedCodeHelper)}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400"
                            >
                              Auto-Fill
                            </button>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Enter 6-Digit Code
                        </label>
                        <div className="relative">
                          <KeyRound className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                          <input
                            type="text"
                            maxLength={6}
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="123456"
                            className="w-full pl-8 pr-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white font-mono tracking-widest text-center"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCodeSent(false);
                            setVerificationCode('');
                          }}
                          className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        >
                          Change Email
                        </button>
                        <button
                          type="submit"
                          disabled={authLoading || verificationCode.trim().length !== 6}
                          className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          <span>{authLoading ? 'Verifying...' : 'Verify & Complete Account'}</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Mode 2: Log In Flow */}
              {authMode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Registered Email
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="email"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Account Password
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="password"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="Your password"
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{authLoading ? 'Signing In...' : 'Log In to Account'}</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* ---------------- SECTION 2: AVATAR & DISPLAY CUSTOMIZATION ---------------- */}
        <form onSubmit={handleSaveProfileDetails} className="space-y-4">
          {/* Avatar Selection Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Choose Arena Avatar
            </label>
            <div className="grid grid-cols-4 gap-2">
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = selectedAvatar === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setSelectedAvatar(preset.id);
                    }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/10 dark:bg-cyan-950/40 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-105'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 opacity-80'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br ${preset.gradient} flex items-center justify-center text-base sm:text-lg shadow-sm`}
                    >
                      {preset.emoji}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate w-full text-center">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Fields: Display Name & Handle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                maxLength={24}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Manu, ApexMaster"
                className="w-full px-3 py-1.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Gamer Handle (@tag)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1.5 text-slate-400 text-xs font-mono">@</span>
                <input
                  type="text"
                  value={username}
                  maxLength={20}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="username"
                  className="w-full pl-7 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Title Badges */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Arena Rank Title
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TITLES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSelectedTitle(t);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedTitle === t
                      ? 'bg-cyan-500 text-slate-950 shadow-sm font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Palette Studio Shortcut */}
          {onOpenPaletteStudio && (
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-cyan-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Custom Palettes Studio
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onOpenPaletteStudio();
                }}
                className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-sm cursor-pointer active:scale-95"
              >
                Open Studio
              </button>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-slate-950" />
              <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
