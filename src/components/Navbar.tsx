import React from 'react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Palette,
  Sun,
  Moon,
  Laptop,
  Users,
  User,
  LogIn,
  Wifi,
} from 'lucide-react';
import { GameMode, ColorMode } from '../types/game';
import { useAuth } from '../context/AuthContext';
import { PRESET_AVATARS } from '../types/user';

interface NavbarProps {
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  colorMode: ColorMode;
  onCycleColorMode: () => void;
  onResetGame: () => void;
  onOpenSettings: () => void;
  onOpenRules: () => void;
  onOpenHistory: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenOnlineLobby: () => void;
  isOnlineActive?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  onSelectMode,
  isMuted,
  onToggleMute,
  colorMode,
  onCycleColorMode,
  onResetGame,
  onOpenSettings,
  onOpenRules,
  onOpenHistory,
  onOpenAuth,
  onOpenProfile,
  onOpenOnlineLobby,
  isOnlineActive = false,
}) => {
  const { user, profile } = useAuth();

  const userAvatar =
    PRESET_AVATARS.find((a) => a.id === profile?.avatarKey) || PRESET_AVATARS[0];

  return (
    <header className="w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/85 backdrop-blur-xl sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Wordmark */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onResetGame();
          }}
          className="font-display text-base sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 sm:gap-2.5 group shrink-0"
        >
          <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 text-xs sm:text-sm font-black shadow-[0_0_12px_rgba(6,182,212,0.2)] group-hover:scale-105 transition-transform">
            ✕
          </span>
          <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            Apex Arena
          </span>
          <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-black shadow-[0_0_12px_rgba(244,63,94,0.2)] group-hover:scale-105 transition-transform">
            ◯
          </span>
        </a>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-900/90 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
          <button
            onClick={() => onSelectMode('classic3x3')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
              currentMode === 'classic3x3'
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-slate-700/80'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Classic 3×3
          </button>
          <button
            onClick={() => onSelectMode('infinite3')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              currentMode === 'infinite3'
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-slate-700/80'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>Infinite 3-Piece</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded-full font-mono border border-amber-500/30">
              Tactic
            </span>
          </button>
          <button
            onClick={() => onSelectMode('grid4x4')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
              currentMode === 'grid4x4'
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-slate-700/80'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Grid 4×4
          </button>
          <button
            onClick={onOpenRules}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-xl transition-colors whitespace-nowrap"
          >
            Rules
          </button>
          <button
            onClick={onOpenHistory}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-xl transition-colors whitespace-nowrap"
          >
            Stats
          </button>
        </nav>

        {/* Zone 3: Actions, Multiplayer & Profile System */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Online Multiplayer Lobby Button */}
          <button
            onClick={onOpenOnlineLobby}
            aria-label="Online Multiplayer"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer ${
              isOnlineActive
                ? 'bg-emerald-500 text-slate-950 animate-pulse'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/20'
            }`}
            title="Play Online with Another Player"
          >
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isOnlineActive ? 'Online Match' : 'Play Online'}
            </span>
          </button>

          {/* Quick Light / Dark Toggle */}
          <button
            onClick={onCycleColorMode}
            aria-label={`Current theme mode: ${colorMode}`}
            className="p-2 sm:px-2.5 sm:py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-slate-800 cursor-pointer shadow-sm"
            title={`Mode: ${colorMode.toUpperCase()}`}
          >
            {colorMode === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : colorMode === 'dark' ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : (
              <Laptop className="w-4 h-4 text-cyan-400" />
            )}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-slate-800 cursor-pointer shadow-sm"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Themes Button */}
          <button
            onClick={onOpenSettings}
            aria-label="Themes and Customization"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-sm"
          >
            <Palette className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
            <span className="hidden md:inline">Workshop</span>
          </button>

          {/* USER PROFILE / LOGIN SYSTEM */}
          {user && profile ? (
            /* Logged in: Profile Chip */
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 pl-1.5 pr-2.5 sm:pr-3 py-1 bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700/80 rounded-2xl border border-cyan-500/30 transition-all cursor-pointer shadow-sm group"
              title="View & Edit Profile, User ID, and Career Stats"
            >
              <div
                className={`w-7 h-7 rounded-xl bg-gradient-to-br ${userAvatar.bg} flex items-center justify-center text-xs shadow-sm shrink-0`}
              >
                {profile.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile.displayName}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <span>{userAvatar.icon}</span>
                )}
              </div>
              <div className="text-left hidden sm:block leading-tight">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[80px]">
                  @{profile.username}
                </div>
                <div className="text-[9px] font-mono text-cyan-500 dark:text-cyan-400 font-semibold">
                  {profile.playerId}
                </div>
              </div>
            </button>
          ) : (
            /* Not Logged In: Sign In Button */
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer hover:shadow-cyan-500/20 active:scale-95"
              title="Sign in with Google or Mobile OTP"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Restart round button */}
          <button
            onClick={onResetGame}
            aria-label="Restart round"
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-slate-800 cursor-pointer shadow-sm"
            title="Reset Current Round"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
