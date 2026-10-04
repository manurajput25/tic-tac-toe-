import React from 'react';
import { Settings, Globe, User } from 'lucide-react';
import { GameMode, UserProfile } from '../types/game';
import { AVATAR_PRESETS } from '../utils/firebase';

interface NavbarProps {
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onOpenSettings?: () => void;
  onOpenOnline: () => void;
  onOpenProfile: () => void;
  profile?: UserProfile | null;
  isOnlineActive?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  onSelectMode,
  onOpenOnline,
  onOpenProfile,
  profile,
  isOnlineActive,
}) => {
  const activeAvatar =
    AVATAR_PRESETS.find((a) => a.id === profile?.avatar) || AVATAR_PRESETS[0];
  return (
    <header className="w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/90 backdrop-blur-xl sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Zone 1: Wordmark */}
        <div className="font-display text-sm sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1 sm:gap-2 group shrink-0 select-none">
          <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 text-xs sm:text-sm font-black shadow-[0_0_12px_rgba(6,182,212,0.2)]">
            ✕
          </span>
          <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            <span className="hidden xs:inline sm:hidden">Apex</span>
            <span className="hidden sm:inline">Apex Arena</span>
          </span>
          <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-black shadow-[0_0_12px_rgba(244,63,94,0.2)]">
            ◯
          </span>
        </div>

        {/* Zone 2: Navigation Game Modes (Scrollable container on ultra-small screens) */}
        <div className="flex-1 min-w-0 max-w-md mx-1 flex justify-center">
          <nav className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 dark:bg-slate-900/90 p-0.5 sm:p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner overflow-x-auto no-scrollbar max-w-full">
            <button
              onClick={() => onSelectMode('classic3x3')}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                currentMode === 'classic3x3'
                  ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-slate-700/80 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="sm:hidden">3×3</span>
              <span className="hidden sm:inline">Classic 3×3</span>
            </button>

            <button
              onClick={() => onSelectMode('infinite3')}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer shrink-0 ${
                currentMode === 'infinite3'
                  ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-slate-700/80 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="sm:hidden">Inf 3</span>
              <span className="hidden sm:inline">Infinite 3</span>
              <span className="hidden md:inline px-1 py-0.2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[8px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                Hot
              </span>
            </button>

            <button
              onClick={() => onSelectMode('grid4x4')}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                currentMode === 'grid4x4'
                  ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-slate-700/80 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="sm:hidden">4×4</span>
              <span className="hidden sm:inline">4×4 Grid</span>
            </button>

            <button
              onClick={() => onSelectMode('grid6x6')}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                currentMode === 'grid6x6'
                  ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-slate-700/80 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="sm:hidden">6×6</span>
              <span className="hidden sm:inline">6×6 Grid</span>
            </button>

            <button
              onClick={() => onSelectMode('grid12x12')}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer shrink-0 ${
                currentMode === 'grid12x12'
                  ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-slate-700/80 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="sm:hidden">12×12</span>
              <span className="hidden sm:inline">12×12 Grid</span>
              <span className="hidden lg:inline px-1 py-0.2 rounded-full bg-amber-500/10 border border-amber-500/30 text-[8px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                6 in Row
              </span>
            </button>
          </nav>
        </div>

        {/* Zone 3: Online, Profile & Settings Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Online Matchmaking Button */}
          <button
            onClick={onOpenOnline}
            aria-label="Online Multiplayer"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold rounded-xl sm:rounded-2xl border transition-all cursor-pointer shadow-sm active:scale-95 ${
              isOnlineActive
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800'
            }`}
            title="Online Multiplayer Battles"
          >
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-500 dark:text-cyan-400 shrink-0" />
            <span className="hidden md:inline font-semibold">Online</span>
            {isOnlineActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            )}
          </button>

          {/* Gamer Profile Button */}
          <button
            onClick={onOpenProfile}
            aria-label="Gamer Profile"
            className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 transition-all cursor-pointer shadow-sm active:scale-95 group"
            title="View or Edit Gamer Profile"
          >
            <div
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-gradient-to-br ${activeAvatar.gradient} flex items-center justify-center text-xs shadow-sm shrink-0`}
            >
              <span>{activeAvatar.emoji}</span>
            </div>
            <span className="hidden lg:inline font-semibold truncate max-w-[90px]">
              {profile?.displayName || 'Profile'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
