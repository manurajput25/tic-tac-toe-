import React, { useState, useRef } from 'react';
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
import { processProfileImage } from '../utils/imageUpload';
import { UserAvatar } from './UserAvatar';
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
  Sparkles,
  Camera,
  Upload,
  Trash2,
  FileText,
  Globe,
  ExternalLink,
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
  // Gamer handle is unique, email-based, and non-changeable
  const username = currentProfile?.username || `apex_${Math.floor(1000 + Math.random() * 9000)}`;

  const [selectedAvatar, setSelectedAvatar] = useState<string>(
    currentProfile?.avatar || AVATAR_PRESETS[0].id
  );
  const [selectedTitle, setSelectedTitle] = useState<string>(
    currentProfile?.title || TITLES[0]
  );
  const [customPhotoURL, setCustomPhotoURL] = useState<string | null>(
    currentProfile?.photoURL || (currentProfile?.avatar?.startsWith('data:image') ? currentProfile.avatar : null)
  );

  // Bio & Personal Links State
  const [bio, setBio] = useState<string>(currentProfile?.bio || '');
  const [website, setWebsite] = useState<string>(currentProfile?.website || '');

  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Authentication State
  const isCurrentlyLoggedIn = Boolean(currentProfile?.email && currentProfile?.isVerified);
  const rememberedEmail =
    typeof window !== 'undefined' ? localStorage.getItem('apex_last_logged_in_email') || '' : '';

  const [authMode, setAuthMode] = useState<'create_account' | 'login'>(
    isCurrentlyLoggedIn || rememberedEmail ? 'login' : 'create_account'
  );
  const [authEmail, setAuthEmail] = useState<string>(
    currentProfile?.email || rememberedEmail || ''
  );
  const [authPassword, setAuthPassword] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [isCodeSent, setIsCodeSent] = useState<boolean>(false);
  const [simulatedCodeHelper, setSimulatedCodeHelper] = useState<string | null>(null);
  const [accountCreatedSuccess, setAccountCreatedSuccess] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // 1. Photo Upload Handler (compresses & center-crops 1:1)
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    setAuthError(null);
    try {
      const dataUrl = await processProfileImage(file, 256, 0.85);
      setCustomPhotoURL(dataUrl);
      sound.playClick();
      setAuthSuccess('Picture uploaded! Click "Save Profile Changes" to save permanently.');
      setTimeout(() => setAuthSuccess(null), 3500);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Could not process image file');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = () => {
    sound.playClick();
    setCustomPhotoURL(null);
    setAuthSuccess('Reverted to character preset');
    setTimeout(() => setAuthSuccess(null), 2500);
  };

  // 2. Send Verification Code (Only for new accounts - "ek email se ek hi account bane")
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
        undefined, // handle generated uniquely on server from email
        selectedAvatar,
        authPassword,
        customPhotoURL,
        bio.trim(),
        website.trim()
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

  // 3. Verify Code & Complete Registration
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
      const finalVerifiedPhoto = res.profile.photoURL || customPhotoURL || null;
      const verifiedProfile: UserProfile = {
        ...res.profile,
        photoURL: finalVerifiedPhoto,
      };

      onSaveProfile(verifiedProfile);
      setDisplayName(verifiedProfile.displayName);
      setSelectedAvatar(verifiedProfile.avatar || AVATAR_PRESETS[0].id);
      setCustomPhotoURL(finalVerifiedPhoto);
      setBio(verifiedProfile.bio || '');
      setWebsite(verifiedProfile.website || '');
      setSelectedTitle(verifiedProfile.title || TITLES[0]);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Invalid verification code');
    } finally {
      setAuthLoading(false);
    }
  };

  // 4. Log In to Existing Account (Instagram / WhatsApp-style instant data restoration)
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
      setAuthSuccess(`Welcome back, ${res.profile.displayName}! All profile data & photo restored.`);

      // Update app profile with restored cloud data
      onSaveProfile(res.profile);
      setDisplayName(res.profile.displayName);
      setSelectedAvatar(res.profile.avatar || AVATAR_PRESETS[0].id);
      setCustomPhotoURL(res.profile.photoURL || null);
      setBio(res.profile.bio || '');
      setWebsite(res.profile.website || '');
      setSelectedTitle(res.profile.title || TITLES[0]);
      setTimeout(() => setAuthSuccess(null), 3500);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Login failed. Check your email and password.');
    } finally {
      setAuthLoading(false);
    }
  };

  // 5. Log Out (Resets active session but keeps cloud account safely backed up for 1-click re-login)
  const handleLogout = async () => {
    setAuthLoading(true);
    try {
      const savedEmail = currentProfile?.email || authEmail || '';
      const guestProfile = await logoutUser();
      sound.playClick();
      onSaveProfile(guestProfile);
      setDisplayName(guestProfile.displayName);
      setSelectedAvatar(guestProfile.avatar);
      setCustomPhotoURL(null);
      setBio('');
      setWebsite('');
      setAuthEmail(savedEmail);
      setAuthPassword('');
      setAuthMode('login'); // Pre-switch to login so user can easily log right back in
      setIsCodeSent(false);
      setAccountCreatedSuccess(false);
      setAuthSuccess('Logged out safely. Your cloud profile & picture remain saved! Log in anytime to restore.');
      setTimeout(() => setAuthSuccess(null), 3000);
    } catch (err) {
      console.warn('Logout notice:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  // 6. Save Profile Details (Name, Bio, Links, Photo, Avatar, Title) to Firestore
  const handleSaveProfileDetails = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!displayName.trim()) {
      setAuthError('Please enter a display name');
      return;
    }

    setIsSaving(true);
    setAuthError(null);
    try {
      const uid = currentProfile?.uid || `anon_${Date.now()}`;
      // Username is permanent, locked, and cannot be changed
      const lockedUsername = currentProfile?.username || username;

      const updatedProfile: UserProfile = {
        uid,
        displayName: displayName.trim().slice(0, 24),
        username: lockedUsername, // PERMANENT UNIQUE HANDLE
        avatar: selectedAvatar,
        photoURL: customPhotoURL,
        bio: bio.trim().slice(0, 250),
        website: website.trim().slice(0, 150),
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

  const formattedWebsiteUrl = website.trim().startsWith('http://') || website.trim().startsWith('https://')
    ? website.trim()
    : `https://${website.trim()}`;

  return (
    <div
      role="dialog"
      aria-label="Gamer Profile and Account"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xl animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="relative w-full max-w-lg my-auto p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl text-slate-900 dark:text-slate-100 overflow-hidden">
        {/* Top ambient highlight */}
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />

        {/* Hidden File Input for Image Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoSelect}
          className="hidden"
          aria-label="Upload profile photo"
        />

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
                Personal bio, links, custom photo & unique gamer handle
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

        {/* Live Identity Card Banner Preview */}
        <div className="mb-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 text-white shadow-lg relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start gap-3.5 relative z-10">
            {/* Clickable Avatar preview with camera overlay */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative group cursor-pointer shrink-0 mt-0.5"
              title="Click to upload profile photo"
            >
              <UserAvatar
                avatar={selectedAvatar}
                photoURL={customPhotoURL}
                size="lg"
                showVerifiedBadge={isCurrentlyLoggedIn}
              />
              <div className="absolute inset-0 bg-slate-950/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-200 text-cyan-400">
                <Camera className="w-4 h-4" />
                <span className="text-[8px] font-bold mt-0.5">Upload</span>
              </div>
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

              {/* Unique Locked Handle Badge */}
              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] sm:text-xs text-slate-400 font-mono">
                <span>@{username.toLowerCase()}</span>
                <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-[9px] text-cyan-400">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Unique Handle</span>
                </span>
              </div>

              {/* Live Bio Preview */}
              {bio.trim() && (
                <p className="text-[11px] text-slate-300 italic mt-1.5 leading-relaxed line-clamp-2">
                  "{bio.trim()}"
                </p>
              )}

              {/* Live Website / Link Preview */}
              {website.trim() && (
                <div className="mt-1">
                  <a
                    href={formattedWebsiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 font-mono hover:underline"
                    title={formattedWebsiteUrl}
                  >
                    <Globe className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate max-w-[200px]">
                      {website.trim().replace(/^https?:\/\//, '')}
                    </span>
                    <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                  </a>
                </div>
              )}

              {/* Stats badges */}
              <div className="flex items-center gap-2.5 mt-2 text-[11px] text-slate-300">
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

        {/* ---------------- SECTION 1: EMAIL ACCOUNT & LOGOUT ---------------- */}
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
                      Account Verified & Synced
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                    {currentProfile?.email}
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                    ✓ Photo, bio & match stats safely backed up in cloud
                  </div>
                </div>
              </div>

              {/* LOGOUT OPTION */}
              <button
                type="button"
                disabled={authLoading}
                onClick={handleLogout}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500 border border-rose-500/30 rounded-xl transition-all cursor-pointer shrink-0 disabled:opacity-50"
                title="Log out (your data remains safely stored in the cloud)"
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
                    <span>{authLoading ? 'Restoring Profile...' : 'Log In & Restore Profile'}</span>
                  </button>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center mt-1 flex items-center justify-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span>Instantly restores your profile picture, bio, stats, and username.</span>
                  </p>
                </form>
              )}
            </div>
          )}
        </div>

        {/* ---------------- SECTION 2: PROFILE DETAILS, BIO & AVATAR ---------------- */}
        <form onSubmit={handleSaveProfileDetails} className="space-y-4">
          {/* PROFILE PHOTO UPLOADER */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-cyan-500" />
                <span>Profile Picture / Photo</span>
              </label>
              {customPhotoURL && (
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Custom Photo Active</span>
                </span>
              )}
            </div>

            {customPhotoURL ? (
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={customPhotoURL}
                    alt="Custom Profile"
                    className="w-12 h-12 rounded-xl object-cover border-2 border-cyan-400 shadow-md shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      Your Uploaded Picture
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Shown across game matches & scoreboard
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                  >
                    <Camera className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Change</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="p-1.5 text-xs font-semibold rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition-colors cursor-pointer"
                    title="Remove custom photo and use character preset"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-3.5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700/80 hover:border-cyan-500 dark:hover:border-cyan-400 bg-slate-50/70 dark:bg-slate-950/40 hover:bg-cyan-500/5 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-cyan-500 transition-colors">
                      {isUploadingPhoto ? 'Uploading & Cropping...' : 'Upload Profile Picture'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Upload from phone, camera or computer (JPG, PNG, WebP)
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-cyan-500 group-hover:bg-cyan-400 text-slate-950 shadow-sm pointer-events-none shrink-0"
                >
                  Browse
                </button>
              </div>
            )}
          </div>

          {/* Character Avatar Preset Options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Or Pick an Arena Character Preset
              </label>
              {customPhotoURL && (
                <span className="text-[10px] text-slate-400">
                  (Selecting a preset will use that avatar)
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = selectedAvatar === preset.id && !customPhotoURL;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setSelectedAvatar(preset.id);
                      setCustomPhotoURL(null); // Switching to preset
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

          {/* Form Fields: Display Name (Changeable) & Gamer Handle (Locked/Permanent) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Display Name
                </label>
                <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold">Changeable</span>
              </div>
              <input
                type="text"
                value={displayName}
                maxLength={24}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Manu, ApexMaster"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Gamer Handle (@tag)</span>
                </label>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-bold">
                  Permanent & Unique
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-xs font-mono select-none">@</span>
                <input
                  type="text"
                  value={username}
                  readOnly
                  disabled
                  className="w-full pl-7 pr-8 py-2 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-500 dark:text-slate-400 font-mono cursor-not-allowed select-none"
                  title="Gamer handle is unique to your verified account and cannot be modified."
                />
                <Lock className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                Unique handle based on your email. Permanent and cannot be changed.
              </p>
            </div>
          </div>

          {/* BIO / DETAILS ABOUT YOURSELF */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-500" />
                <span>About Yourself (Bio)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {bio.length}/250
              </span>
            </div>
            <textarea
              value={bio}
              maxLength={250}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              placeholder="Tell opponents about your playstyle, opening tactics, or personal bio..."
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white resize-none leading-relaxed"
            />
          </div>

          {/* PERSONAL LINKS & SOCIALS */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Social Links & Details
            </label>
            <div className="relative">
              <Globe className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={website}
                maxLength={150}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="e.g. twitter.com/username, github.com/user, or portfolio"
                className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Add your website, YouTube, Discord, Twitter/X, or GitHub profile.
            </p>
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
