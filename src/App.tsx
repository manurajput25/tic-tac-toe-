/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  GameMode,
  OpponentType,
  BotDifficulty,
  ThemeId,
  ColorMode,
  BoardCustomization,
  BackgroundCustomization,
} from './types/game';
import { THEMES } from './utils/theme';
import { sound } from './utils/audio';
import { useGameEngine } from './hooks/useGameEngine';
import { Navbar } from './components/Navbar';
import { ScoreBoard } from './components/ScoreBoard';
import { Board } from './components/Board';
import { GameControls } from './components/GameControls';
import { GameOverModal } from './components/GameOverModal';
import { ReplayViewer } from './components/ReplayViewer';
import { GameSettingsModal } from './components/GameSettingsModal';
import { RulesModal } from './components/RulesModal';
import { StatsModal } from './components/StatsModal';
import { ParticleBackground } from './components/ParticleBackground';
import { StreakCelebration } from './components/StreakCelebration';

const PREFS_STORAGE_KEY = 'apex_ttt_prefs_v1';

const DEFAULT_BOARD_CUSTOMIZATION: BoardCustomization = {
  style: 'glass-stadium',
  cellFinish: 'frosted-glass',
  markStyle: 'neon-glow',
  showCoordinates: true,
  showTurnGlow: true,
};

const DEFAULT_BACKGROUND_CUSTOMIZATION: BackgroundCustomization = {
  bgTheme: 'deep-space',
  style: 'constellation',
  density: 'medium',
  speed: 'normal',
  trail: 'stardust',
  showGlowOrbs: true,
};

export default function App() {
  // Game Setup Preferences
  const [mode, setMode] = useState<GameMode>('classic3x3');
  const [opponent, setOpponent] = useState<OpponentType>('bot');
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('unbeatable');
  const [themeId, setThemeId] = useState<ThemeId>('cyber-neon');
  const [colorMode, setColorMode] = useState<ColorMode>('dark');
  const [startingPlayer, setStartingPlayer] = useState<'X' | 'O' | 'alternate'>('alternate');
  const [blitzDuration, setBlitzDuration] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());
  const [boardCustomization, setBoardCustomization] = useState<BoardCustomization>(DEFAULT_BOARD_CUSTOMIZATION);
  const [backgroundCustomization, setBackgroundCustomization] = useState<BackgroundCustomization>(DEFAULT_BACKGROUND_CUSTOMIZATION);

  // Unified Clean Game Engine
  const engine = useGameEngine({
    mode,
    opponent,
    botDifficulty,
    startingPlayer,
    blitzDuration,
  });

  // Modal Dialog States
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);
  const [isReplayOpen, setIsReplayOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);

  // Atmosphere transition
  const [transitionKey, setTransitionKey] = useState<number>(0);
  const [transitionColor, setTransitionColor] = useState<string>('#06b6d4');
  const isInitialMount = useRef<boolean>(true);

  // OS Dark Mode Preference
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const isDarkMode = colorMode === 'dark' || (colorMode === 'system' && systemPrefersDark);
  const currentTheme = THEMES[themeId] || THEMES['cyber-neon'];

  // Listen for System Dark Mode changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Update HTML root class for dark mode
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Load Saved Preferences from localStorage on Boot
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PREFS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.mode) setMode(parsed.mode);
        if (parsed.opponent) setOpponent(parsed.opponent);
        if (parsed.botDifficulty) setBotDifficulty(parsed.botDifficulty);
        if (parsed.themeId) setThemeId(parsed.themeId);
        if (parsed.colorMode) setColorMode(parsed.colorMode);
        if (parsed.startingPlayer) setStartingPlayer(parsed.startingPlayer);
        if (parsed.blitzDuration !== undefined) setBlitzDuration(parsed.blitzDuration);
        if (parsed.boardCustomization) {
          setBoardCustomization((prev) => ({ ...prev, ...parsed.boardCustomization }));
        }
        if (parsed.backgroundCustomization) {
          setBackgroundCustomization((prev) => ({ ...prev, ...parsed.backgroundCustomization }));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Save Preferences to localStorage
  const savePrefs = (updates: Record<string, unknown>) => {
    try {
      const saved = localStorage.getItem(PREFS_STORAGE_KEY);
      const current = saved ? JSON.parse(saved) : {};
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify({ ...current, ...updates }));
    } catch {
      // ignore
    }
  };

  // Open Game Over Modal when match finishes (unless streak milestone sequence is active)
  useEffect(() => {
    if (engine.status === 'won' || engine.status === 'draw') {
      if (engine.streakMilestone === 3) {
        setIsGameOverModalOpen(false);
        return;
      }
      const timer = setTimeout(() => {
        setIsGameOverModalOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    } else {
      setIsGameOverModalOpen(false);
    }
  }, [engine.status, engine.streakMilestone]);

  // Trigger Theme Ambient Ripple
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setTransitionColor(currentTheme.xColor || '#06b6d4');
    setTransitionKey((prev) => prev + 1);
  }, [themeId, colorMode, currentTheme.xColor]);

  // Handle Cell Click
  const handleCellClick = (index: number) => {
    engine.makeMove(index);
  };

  // Keyboard Shortcuts (Numpad 1..9, 'r' reset, 'h' hint, 'm' mute)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOverModalOpen || isReplayOpen || isSettingsOpen || isRulesOpen || isStatsOpen) {
        if (e.key === 'Escape') {
          setIsGameOverModalOpen(false);
          setIsReplayOpen(false);
          setIsSettingsOpen(false);
          setIsRulesOpen(false);
          setIsStatsOpen(false);
        }
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        engine.resetRound();
        return;
      }

      if (e.key === 'h' || e.key === 'H') {
        engine.requestHint();
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        setIsMuted(sound.toggleMute());
        return;
      }

      // Numpad / Digits 1..9 mapping for 3x3 board
      if (mode === 'classic3x3' || mode === 'infinite3') {
        const keyMap: Record<string, number> = {
          '7': 0, '8': 1, '9': 2,
          '4': 3, '5': 4, '6': 5,
          '1': 6, '2': 7, '3': 8,
        };
        if (e.key in keyMap) {
          handleCellClick(keyMap[e.key]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isGameOverModalOpen,
    isReplayOpen,
    isSettingsOpen,
    isRulesOpen,
    isStatsOpen,
    engine,
    mode,
  ]);

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-500 relative overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-300 ${
        isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Dynamic Interactive Ambient Canvas */}
      <ParticleBackground
        theme={currentTheme}
        isDark={isDarkMode}
        customization={backgroundCustomization}
        winningPlayer={engine.status === 'won' ? engine.winner : null}
      />

      {/* Atmospheric Theme Ripple on Switch */}
      {transitionKey > 0 && (
        <div
          key={transitionKey}
          className="fixed inset-0 pointer-events-none z-30 animate-theme-bloom"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${transitionColor}44 0%, ${transitionColor}18 50%, transparent 80%)`,
          }}
        />
      )}

      {/* Navigation Bar */}
      <Navbar
        currentMode={mode}
        onSelectMode={(newMode) => {
          sound.playClick();
          setMode(newMode);
        }}
        onOpenSettings={() => {
          sound.playClick();
          setIsSettingsOpen(true);
        }}
      />

      {/* Main Game Center */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-8 max-w-4xl mx-auto w-full">
        {/* Score & Turn Status */}
        <ScoreBoard
          score={engine.score}
          currentPlayer={engine.currentPlayer}
          opponent={opponent}
          botDifficulty={botDifficulty}
          theme={currentTheme}
          blitzTimeLeft={engine.blitzTimeLeft}
          blitzDuration={blitzDuration}
          roundNumber={engine.roundNumber}
          isBotThinking={engine.isBotThinking}
        />

        {/* Interactive Game Board */}
        <Board
          board={engine.board}
          mode={mode}
          theme={currentTheme}
          currentPlayer={engine.currentPlayer}
          winningLine={engine.winningLine}
          winner={engine.winner}
          isGameOver={engine.status !== 'playing'}
          isBotThinking={engine.isBotThinking}
          hintIndex={engine.hintIndex}
          xPieceIndices={engine.xPieceIndices}
          oPieceIndices={engine.oPieceIndices}
          customization={boardCustomization}
          onCellClick={handleCellClick}
        />

        {/* Action Controls */}
        <GameControls
          opponent={opponent}
          onChangeOpponent={(newOpponent) => {
            sound.playClick();
            setOpponent(newOpponent);
            engine.resetRound();
          }}
          botDifficulty={botDifficulty}
          onChangeDifficulty={(diff) => {
            sound.playClick();
            setBotDifficulty(diff);
            engine.resetRound();
          }}
          onGetHint={engine.requestHint}
          onResetRound={engine.resetRound}
          isGameOver={engine.status !== 'playing'}
          canHint={engine.status === 'playing' && !engine.isBotThinking}
          gameMode={mode}
        />
      </main>

      {/* Footer Branding & Keyboard Info */}
      <footer className="relative z-10 py-4 text-center text-xs text-slate-500 dark:text-slate-500 border-t border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center justify-center gap-4">
          <span>Keyboard: Numpad 1..9 to place move</span>
          <span>•</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">R</kbd> restart</span>
          <span>•</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">H</kbd> hint</span>
          <span>•</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">M</kbd> mute</span>
        </div>
      </footer>

      {/* Special 3-Win Streak Animation Sequence */}
      {engine.streakMilestone === 3 && (
        <StreakCelebration
          streakCount={3}
          onClose={() => {
            sound.playClick();
            engine.clearStreakMilestone();
            setIsGameOverModalOpen(true);
          }}
        />
      )}

      {/* Dialog Modals */}
      {isGameOverModalOpen && (
        <GameOverModal
          status={engine.status}
          winner={engine.winner}
          opponent={opponent}
          theme={currentTheme}
          streakCount={engine.score.currentStreak}
          onPlayAgain={engine.resetRound}
          onReviewMatch={() => {
            sound.playClick();
            setIsGameOverModalOpen(false);
            setIsReplayOpen(true);
          }}
          onClose={() => setIsGameOverModalOpen(false)}
        />
      )}

      {isReplayOpen && (
        <ReplayViewer
          moves={engine.moves}
          mode={mode}
          theme={currentTheme}
          onClose={() => setIsReplayOpen(false)}
        />
      )}

      {isSettingsOpen && (
        <GameSettingsModal
          currentTheme={themeId}
          onSelectTheme={(id) => {
            sound.playClick();
            setThemeId(id);
            savePrefs({ themeId: id });
          }}
          colorMode={colorMode}
          onSelectColorMode={(cm) => {
            sound.playClick();
            setColorMode(cm);
            savePrefs({ colorMode: cm });
          }}
          blitzDuration={blitzDuration}
          onSelectBlitz={(dur) => {
            sound.playClick();
            setBlitzDuration(dur);
            savePrefs({ blitzDuration: dur });
          }}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted(sound.toggleMute())}
          startingPlayer={startingPlayer}
          onSelectStartingPlayer={(starter) => {
            sound.playClick();
            setStartingPlayer(starter);
            savePrefs({ startingPlayer: starter });
          }}
          boardCustomization={boardCustomization}
          onUpdateBoardCustomization={(u) => {
            setBoardCustomization((prev) => {
              const updated = { ...prev, ...u };
              savePrefs({ boardCustomization: updated });
              return updated;
            });
          }}
          backgroundCustomization={backgroundCustomization}
          onUpdateBackgroundCustomization={(u) => {
            setBackgroundCustomization((prev) => {
              const updated = { ...prev, ...u };
              savePrefs({ backgroundCustomization: updated });
              return updated;
            });
          }}
          score={engine.score}
          onResetStats={engine.resetScores}
          onResetRound={engine.resetRound}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {isRulesOpen && <RulesModal onClose={() => setIsRulesOpen(false)} />}
      {isStatsOpen && (
        <StatsModal
          score={engine.score}
          currentMode={mode}
          onResetStats={engine.resetScores}
          onClose={() => setIsStatsOpen(false)}
        />
      )}
    </div>
  );
}
