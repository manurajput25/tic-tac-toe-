import React from 'react';
import { Volume2, VolumeX, RotateCcw, Palette, Sun, Moon, Laptop } from 'lucide-react';
import { GameMode, ColorMode } from '../types/game';

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
}) => {
  return (
    <header className="w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/85 backdrop-blur-xl sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Wordmark */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onResetGame();
          }}
          className="font-display text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5 group shrink-0"
        >
          <span className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 text-sm font-black shadow-[0_0_12px_rgba(6,182,212,0.2)] group-hover:scale-105 transition-transform">
            ✕
          </span>
          <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            Apex Tic-Tac-Toe
          </span>
          <span className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 text-sm font-black shadow-[0_0_12px_rgba(244,63,94,0.2)] group-hover:scale-105 transition-transform">
            ◯
          </span>
        </a>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-900/90 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
          <button
            onClick={() => onSelectMode('classic3x3')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
              currentMode === 'classic3x3'
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-slate-700/80'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`}
          >
            Classic 3×3
          </button>
          <button
            onClick={() => onSelectMode('infinite3')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              currentMode === 'infinite3'
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-slate-700/80'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <span>Infinite 3-Piece</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded-full font-mono border border-amber-500/30">
              Tactic
            </span>
          </button>
          <button
            onClick={() => onSelectMode('grid4x4')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
              currentMode === 'grid4x4'
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-slate-700/80'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`}
          >
            Grid 4×4
          </button>
          <button
            onClick={onOpenRules}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors whitespace-nowrap"
          >
            Rules
          </button>
          <button
            onClick={onOpenHistory}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors whitespace-nowrap"
          >
            Stats
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Quick Light / Dark / System Toggle */}
          <button
            onClick={onCycleColorMode}
            aria-label={`Current theme mode: ${colorMode}. Click to switch theme`}
            className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-all border border-slate-200 dark:border-slate-800/80 cursor-pointer shadow-sm"
            title={`Mode: ${colorMode.toUpperCase()} (Click to toggle Light / Dark / System)`}
          >
            {colorMode === 'light' ? (
              <>
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="hidden sm:inline font-semibold">Light</span>
              </>
            ) : colorMode === 'dark' ? (
              <>
                <Moon className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline font-semibold">Dark</span>
              </>
            ) : (
              <>
                <Laptop className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                <span className="hidden sm:inline font-semibold">System</span>
              </>
            )}
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            className="p-2 sm:p-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-all border border-slate-200 dark:border-slate-800/80 cursor-pointer shadow-sm"
            title={isMuted ? 'Unmute audio' : 'Mute audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400 dark:text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />}
          </button>

          {/* Explicit Themes Button */}
          <button
            onClick={onOpenSettings}
            aria-label="Open Themes and Settings"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer shadow-sm"
            title="Choose Themes and Arena Options"
          >
            <Palette className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="hidden sm:inline">Themes</span>
          </button>

          {/* Reset Round Button */}
          <button
            onClick={onResetGame}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 rounded-xl border border-slate-800 dark:border-slate-700/80 shadow-md transition-all whitespace-nowrap cursor-pointer"
            title="Restart current round"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Mobile Mode & Options Switcher Bar */}
      <div className="flex md:hidden border-t border-slate-200/80 dark:border-slate-800/80 px-4 py-2 bg-white/95 dark:bg-slate-950/95 overflow-x-auto gap-1 text-xs">
        <button
          onClick={() => onSelectMode('classic3x3')}
          className={`px-3 py-1 rounded-lg whitespace-nowrap font-medium ${
            currentMode === 'classic3x3'
              ? 'bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-semibold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Classic 3×3
        </button>
        <button
          onClick={() => onSelectMode('infinite3')}
          className={`px-3 py-1 rounded-lg whitespace-nowrap font-medium ${
            currentMode === 'infinite3'
              ? 'bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-semibold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Infinite 3-Piece
        </button>
        <button
          onClick={() => onSelectMode('grid4x4')}
          className={`px-3 py-1 rounded-lg whitespace-nowrap font-medium ${
            currentMode === 'grid4x4'
              ? 'bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-semibold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Grid 4×4
        </button>
        <button
          onClick={onOpenSettings}
          className="px-3 py-1 rounded-lg whitespace-nowrap text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-1 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60"
        >
          <Palette className="w-3 h-3" />
          <span>Themes</span>
        </button>
        <button onClick={onOpenRules} className="px-3 py-1 rounded-lg whitespace-nowrap text-slate-600 dark:text-slate-400">
          Rules
        </button>
        <button onClick={onOpenHistory} className="px-3 py-1 rounded-lg whitespace-nowrap text-slate-600 dark:text-slate-400">
          Stats
        </button>
      </div>
    </header>
  );
};
