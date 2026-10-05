import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types/game';
import {
  AVATAR_PRESETS,
  saveProfileToFirestore,
  loginWithGoogle,
} from '../utils/firebase';
import { sound } from '../utils/audio';
import {
  X,
  User,
  Sparkles,
  Trophy,
  Flame,
  Check,
  ShieldCheck,
  LogIn,
  Edit3,
  Palette,
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
  const [displayName, setDisplayName] = useState<string>(
    currentProfile?.displayName || 'Player 1'
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
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [googleSuccessMsg, setGoogleSuccessMsg] = useState<string | null>(null);

  const activeAvatar =
    AVATAR_PRESETS.find((a) => a.id === selectedAvatar) || AVATAR_PRESETS[0];

  const [showManualGoogleInput, setShowManualGoogleInput] = useState<boolean>(false);
  const [googleEmailInput, setGoogleEmailInput] = useState<string>(
    currentProfile?.email || 'manukirar82@gmail.com'
  );

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!displayName.trim()) {
      setErrorMsg('Please enter a display name');
      return;
    }
    if (!username.trim()) {
      setErrorMsg('Please enter a username tag');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    try {
      const uid = currentProfile?.uid || `anon_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const updatedProfile: UserProfile = {
        uid,
        displayName: displayName.trim().slice(0, 24),
        username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20),
        avatar: selectedAvatar,
        title: selectedTitle,
        email: currentProfile?.email || null,
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
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualGoogleSync = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = googleEmailInput.trim().toLowerCase();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Please enter a valid Google email address');
      return;
    }
    const namePart = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '');
    const cleanDisplayName = displayName === 'Player 1' || displayName === 'Apex Player' ? namePart : displayName;
    
    const updatedProfile: UserProfile = {
      ...(currentProfile || {
        uid: `google_${Date.now()}`,
        avatar: selectedAvatar,
        title: selectedTitle,
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        bestStreak: 0,
        createdAt: new Date().toISOString(),
      }),
      displayName: cleanDisplayName.trim().slice(0, 24),
      username: namePart.slice(0, 20),
      email: cleanEmail,
      avatar: selectedAvatar,
      title: selectedTitle,
      updatedAt: new Date().toISOString(),
    };

    setDisplayName(cleanDisplayName);
    setUsername(namePart);
    onSaveProfile(updatedProfile);
    saveProfileToFirestore(updatedProfile).catch(() => {});
    setShowManualGoogleInput(false);
    setGoogleSuccessMsg(`Successfully linked with ${cleanEmail}!`);
    sound.playWin();
    setTimeout(() => setGoogleSuccessMsg(null), 3500);
  };

  const handleGoogleConnect = async () => {
    setIsGoogleLoading(true);
    setErrorMsg(null);
    setGoogleSuccessMsg(null);
    try {
      sound.playClick();
      const user = await loginWithGoogle();
      if (user) {
        if (user.displayName) setDisplayName(user.displayName);
        if (user.email) {
          const handle = user.email.split('@')[0].replace(/[^a-z0-9_]/g, '');
          setUsername(handle);
        }
        setGoogleSuccessMsg(`Synced with Google: ${user.email}`);

        // Update profile with Google info
        const updatedProfile: UserProfile = {
          uid: user.uid,
          displayName: (user.displayName || displayName).trim().slice(0, 24),
          username: user.email ? user.email.split('@')[0].replace(/[^a-z0-9_]/g, '').slice(0, 20) : username,
          avatar: selectedAvatar,
          title: selectedTitle,
          email: user.email || null,
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
        onSaveProfile(updatedProfile);
        sound.playWin();
        setTimeout(() => setGoogleSuccessMsg(null), 3500);
      }
    } catch (err: unknown) {
      console.warn('Google popup notice (activating direct link):', err);
      // Popup blocked or auth domain restricted in preview iframe -> activate direct email link
      setShowManualGoogleInput(true);
      setErrorMsg(null);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Gamer Profile"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xl animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="relative w-full max-w-lg my-auto p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl text-slate-900 dark:text-slate-100 overflow-hidden">
        {/* Top ambient highlight */}
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500 shadow-sm">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                {currentProfile ? 'Gamer Profile' : 'Create Your Profile'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Personalize your multiplayer identity & arena record
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

        {/* Live Identity Card Preview */}
        <div className="mb-5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 text-white shadow-lg relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3.5 relative z-10">
            {/* Avatar preview */}
            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${activeAvatar.gradient} flex items-center justify-center text-2xl shadow-lg border-2 border-white/20 shrink-0`}
            >
              <span>{activeAvatar.emoji}</span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-base tracking-tight truncate text-white">
                  {displayName || 'Apex Champion'}
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-[9px] font-bold text-cyan-300 uppercase tracking-wider shrink-0">
                  {selectedTitle}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                @{username.toLowerCase() || 'player'}
              </div>

              {/* Stats badges */}
              <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-300">
                <span className="flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  <strong className="text-white">{currentProfile?.wins || 0}</strong> Wins
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-400" />
                  Best <strong className="text-white">{currentProfile?.bestStreak || 0}x</strong> Streak
                </span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Avatar Selection Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Choose Arena Avatar
            </label>
            <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
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
                      className={`w-9 h-9 rounded-xl bg-gradient-to-br ${preset.gradient} flex items-center justify-center text-lg shadow-sm`}
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

          {/* Form Fields: Display Name & Gamer Handle */}
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
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Gamer Handle (@tag)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-sm font-mono">@</span>
                <input
                  type="text"
                  value={username}
                  maxLength={20}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="username"
                  className="w-full pl-7 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white font-mono"
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

          {/* Custom Palette Studio Link */}
          {onOpenPaletteStudio && (
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-500">
                  <Palette className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Custom Palettes
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    {currentProfile?.customPalettes?.length || 0} saved theme palettes
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onOpenPaletteStudio();
                }}
                className="px-2.5 py-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-sm cursor-pointer active:scale-95 transition-all"
              >
                Open Studio
              </button>
            </div>
          )}

          {/* Google Account Sync */}
          {currentProfile?.email ? (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <div className="flex items-center gap-2.5 min-w-0">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white truncate">
                    Google Identity Verified
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono truncate">
                    {currentProfile.email}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowManualGoogleInput(true)}
                className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30 shrink-0 cursor-pointer"
              >
                Change
              </button>
            </div>
          ) : showManualGoogleInput ? (
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <LogIn className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Link Google Account</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowManualGoogleInput(false)}
                  className="text-slate-400 hover:text-slate-200 text-xs p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Enter your Google Account email to sync your arena profile:
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white font-mono"
                />
                <button
                  type="button"
                  onClick={handleManualGoogleSync}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-sm cursor-pointer whitespace-nowrap active:scale-95"
                >
                  Confirm Link
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-1 space-y-1.5">
              <button
                type="button"
                disabled={isGoogleLoading}
                onClick={handleGoogleConnect}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-slate-700 dark:text-slate-300 cursor-pointer disabled:opacity-60"
              >
                <LogIn className={`w-3.5 h-3.5 text-cyan-500 ${isGoogleLoading ? 'animate-spin' : ''}`} />
                <span>{isGoogleLoading ? 'Connecting with Google...' : 'Sync with Google Account'}</span>
              </button>
              <p className="text-[10px] text-center text-slate-400">
                🎮 Google Sign-In is optional! You can customize your avatar and play online immediately.
              </p>
            </div>
          )}

          {googleSuccessMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{googleSuccessMsg}</span>
            </div>
          )}

          {errorMsg && (
            <p className="text-xs text-rose-500 dark:text-rose-400 font-medium">
              {errorMsg}
            </p>
          )}

          {/* Submit Action */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-slate-950" />
              <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
