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
  Player,
  BoardCustomization,
  BackgroundCustomization,
  WinningLine,
} from './types/game';
import { THEMES, BACKGROUND_THEMES } from './utils/theme';
import { sound } from './utils/audio';
import { triggerConfetti } from './utils/confetti';
import { checkWin, isBoardFull } from './utils/ai';
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
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { OnlineLobbyModal } from './components/OnlineLobbyModal';
import { OnlineMatchBanner } from './components/OnlineMatchBanner';
import { useAuth } from './context/AuthContext';
import { MatchRoom } from './types/user';
import {
  subscribeToRoom,
  makeOnlineMove,
  leaveOnlineRoom,
  resetOnlineMatch,
} from './services/multiplayerService';

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

  // Auth & Cloud Profile Context
  const { user, profile, redirectLoading, recordGameResult } = useAuth();

  // Online Multiplayer Room State
  const [activeOnlineRoom, setActiveOnlineRoom] = useState<MatchRoom | null>(null);
  const [localPlayerMark, setLocalPlayerMark] = useState<Player>('X');

  // Unified Clean Game Engine
  const engine = useGameEngine({
    mode,
    opponent,
    botDifficulty,
    startingPlayer,
    blitzDuration,
    isOnlineActive: !!activeOnlineRoom,
    onGameEnd: (result) => {
      recordGameResult(result);
    },
  });

  // Modal Dialog States
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);
  const [isReplayOpen, setIsReplayOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isOnlineLobbyOpen, setIsOnlineLobbyOpen] = useState<boolean>(false);

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
  const bgThemeConfig = BACKGROUND_THEMES[backgroundCustomization.bgTheme] || BACKGROUND_THEMES['deep-space'];

  // Load Saved Preferences on Mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.themeId && THEMES[p.themeId as ThemeId]) setThemeId(p.themeId);
        if (p.colorMode) setColorMode(p.colorMode);
        if (p.botDifficulty) setBotDifficulty(p.botDifficulty);
        if (p.blitzDuration !== undefined) setBlitzDuration(p.blitzDuration);
        if (p.startingPlayer) setStartingPlayer(p.startingPlayer);
        if (p.boardCustomization) setBoardCustomization((prev) => ({ ...prev, ...p.boardCustomization }));
        if (p.backgroundCustomization) setBackgroundCustomization((prev) => ({ ...prev, ...p.backgroundCustomization }));
      }
    } catch {
      // ignore
    }
  }, []);

  const savePrefs = (updates: Record<string, unknown>) => {
    try {
      const prev = localStorage.getItem(PREFS_STORAGE_KEY);
      const parsed = prev ? JSON.parse(prev) : {};
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify({ ...parsed, ...updates }));
    } catch {
      // ignore
    }
  };

  // Sync Dark/Light theme class on document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [isDarkMode]);

  // Open GameOver modal gracefully after match concludes
  useEffect(() => {
    if (engine.status === 'won' || engine.status === 'draw') {
      const timer = setTimeout(() => {
        setIsGameOverModalOpen(true);
      }, 750);
      return () => clearTimeout(timer);
    } else {
      setIsGameOverModalOpen(false);
    }
  }, [engine.status]);

  // Visual Atmosphere Transition on Theme Switch
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setTransitionColor(currentTheme.xColor || '#06b6d4');
    setTransitionKey((prev) => prev + 1);
  }, [themeId, colorMode, currentTheme.xColor]);

  // Subscribe to Live Online Room Updates
  useEffect(() => {
    if (!activeOnlineRoom) return;

    const unsubscribe = subscribeToRoom(activeOnlineRoom.id, (room) => {
      if (!room || room.status === 'abandoned') {
        setActiveOnlineRoom(null);
        engine.resetRound();
        return;
      }

      setActiveOnlineRoom(room);
      engine.setBoard(room.board);
      engine.setCurrentPlayer(room.currentTurn);
      if (room.xPieceIndices) engine.setXPieceIndices(room.xPieceIndices);
      if (room.oPieceIndices) engine.setOPieceIndices(room.oPieceIndices);

      if (room.winner !== undefined && room.winner !== null) {
        engine.setWinner(room.winner === 'draw' ? null : room.winner);
        engine.setStatus(room.winner === 'draw' ? 'draw' : 'won');
        engine.setWinningLine(room.winningLine || null);

        // Sound & celebratory effects once when game ends
        if (room.status === 'completed' && engine.status === 'playing') {
          if (room.winner === localPlayerMark) {
            triggerConfetti();
            sound.playWin();
            recordGameResult('win');
          } else if (room.winner === 'draw') {
            sound.playDraw();
            recordGameResult('draw');
          } else {
            sound.playDefeat();
            recordGameResult('loss');
          }
        }
      }
    });

    return () => unsubscribe();
  }, [activeOnlineRoom?.id, localPlayerMark, engine, recordGameResult]);

  // Handle Cell Click (Local & Online)
  const handleCellClick = (index: number) => {
    // 1. Online Multiplayer Move
    if (activeOnlineRoom) {
      if (activeOnlineRoom.status !== 'playing') return;
      if (activeOnlineRoom.currentTurn !== localPlayerMark) return; // Wait for turn!
      if (engine.board[index] !== null) return;

      const newBoard = [...engine.board];
      newBoard[index] = localPlayerMark;

      let newXPieces = [...engine.xPieceIndices];
      let newOPieces = [...engine.oPieceIndices];

      if (mode === 'infinite3') {
        if (localPlayerMark === 'X') {
          if (newXPieces.length >= 3) {
            const oldest = newXPieces.shift()!;
            newBoard[oldest] = null;
            sound.playDisappear();
          }
          newXPieces.push(index);
        } else {
          if (newOPieces.length >= 3) {
            const oldest = newOPieces.shift()!;
            newBoard[oldest] = null;
            sound.playDisappear();
          }
          newOPieces.push(index);
        }
      }

      sound.playMove(localPlayerMark);

      const winResult = checkWin(newBoard, mode);
      const isFull = isBoardFull(newBoard);
      const nextTurn: Player = localPlayerMark === 'X' ? 'O' : 'X';

      let winVal: Player | 'draw' | null = null;
      let lineVal: WinningLine | null = null;

      if (winResult) {
        winVal = localPlayerMark;
        lineVal = winResult;
      } else if (isFull && mode !== 'infinite3') {
        winVal = 'draw';
      }

      makeOnlineMove(
        activeOnlineRoom.id,
        newBoard,
        nextTurn,
        index,
        newXPieces,
        newOPieces,
        winVal,
        lineVal
      );
      return;
    }

    // 2. Local Move (PvP or vs Bot)
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
        if (activeOnlineRoom) {
          resetOnlineMatch(activeOnlineRoom.id, activeOnlineRoom.mode);
        } else {
          engine.resetRound();
        }
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

      // 3x3 Numpad mapping (7 8 9 / 4 5 6 / 1 2 3)
      if (mode !== 'grid4x4') {
        const numpadMap: Record<string, number> = {
          Numpad7: 0,
          Numpad8: 1,
          Numpad9: 2,
          Numpad4: 3,
          Numpad5: 4,
          Numpad6: 5,
          Numpad1: 6,
          Numpad2: 7,
          Numpad3: 8,
          Digit1: 0,
          Digit2: 1,
          Digit3: 2,
          Digit4: 3,
          Digit5: 4,
          Digit6: 5,
          Digit7: 6,
          Digit8: 7,
          Digit9: 8,
        };

        if (numpadMap[e.code] !== undefined) {
          handleCellClick(numpadMap[e.code]);
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
    mode,
    activeOnlineRoom,
    engine,
  ]);

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? bgThemeConfig.cssBg : 'bg-slate-100'
      } text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-700`}
    >
      {/* Interactive Particle Canvas */}
      <ParticleBackground
        theme={currentTheme}
        isDark={isDarkMode}
        customization={backgroundCustomization}
      />

      {/* Ambient Lighting Mesh */}
      {backgroundCustomization.showGlowOrbs && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div
            className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[140px] opacity-25"
            style={{ backgroundColor: bgThemeConfig.ambientOrbs.orb1 }}
          />
          <div
            className="absolute top-[40%] -left-[10%] w-[450px] h-[450px] rounded-full blur-[130px] opacity-20"
            style={{ backgroundColor: bgThemeConfig.ambientOrbs.orb2 }}
          />
          <div
            className="absolute -bottom-[10%] -right-[10%] w-[450px] h-[450px] rounded-full blur-[130px] opacity-20"
            style={{ backgroundColor: bgThemeConfig.ambientOrbs.orb3 }}
          />
        </div>
      )}

      {/* Screen Atmosphere Transition Bloom */}
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
          if (activeOnlineRoom) return;
          sound.playClick();
          setMode(newMode);
        }}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(sound.toggleMute())}
        colorMode={colorMode}
        onCycleColorMode={() => {
          sound.playClick();
          const next: ColorMode = colorMode === 'dark' ? 'light' : colorMode === 'light' ? 'system' : 'dark';
          setColorMode(next);
          savePrefs({ colorMode: next });
        }}
        onResetGame={() => {
          if (activeOnlineRoom) {
            resetOnlineMatch(activeOnlineRoom.id, activeOnlineRoom.mode);
          } else {
            engine.resetRound();
          }
        }}
        onOpenSettings={() => {
          sound.playClick();
          setIsSettingsOpen(true);
        }}
        onOpenRules={() => {
          sound.playClick();
          setIsRulesOpen(true);
        }}
        onOpenHistory={() => {
          sound.playClick();
          setIsStatsOpen(true);
        }}
        onOpenAuth={() => {
          sound.playClick();
          setIsAuthModalOpen(true);
        }}
        onOpenProfile={() => {
          sound.playClick();
          setIsProfileModalOpen(true);
        }}
        onOpenOnlineLobby={() => {
          sound.playClick();
          setIsOnlineLobbyOpen(true);
        }}
        isOnlineActive={!!activeOnlineRoom}
      />

      {/* Main Game Center */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-8 max-w-4xl mx-auto w-full">
        {/* Active Online Match Banner */}
        {activeOnlineRoom && (
          <OnlineMatchBanner
            room={activeOnlineRoom}
            localPlayerMark={localPlayerMark}
            isMyTurn={activeOnlineRoom.currentTurn === localPlayerMark}
            onLeaveRoom={async () => {
              sound.playClick();
              if (user) await leaveOnlineRoom(activeOnlineRoom.id, user.uid);
              setActiveOnlineRoom(null);
              engine.resetRound();
            }}
            onRematch={() => {
              sound.playClick();
              resetOnlineMatch(activeOnlineRoom.id, activeOnlineRoom.mode);
            }}
          />
        )}

        {/* Score & Turn Status */}
        <ScoreBoard
          score={engine.score}
          currentPlayer={engine.currentPlayer}
          opponent={activeOnlineRoom ? 'pvp' : opponent}
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
            savePrefs({ botDifficulty: diff });
            engine.resetRound();
          }}
          onGetHint={engine.requestHint}
          onResetRound={engine.resetRound}
          isGameOver={engine.status !== 'playing'}
          canHint={!engine.isBotThinking && engine.status === 'playing'}
          gameMode={mode}
        />
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/80 dark:border-slate-900/80 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400 z-10">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Apex Tic-Tac-Toe · Pure & Modern Arena</span>
          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
            <button onClick={() => setIsRulesOpen(true)} className="hover:text-slate-200 transition-colors">
              How to Play
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="hover:text-slate-200 transition-colors">
              Themes
            </button>
            <button onClick={() => setIsStatsOpen(true)} className="hover:text-slate-200 transition-colors">
              Stats
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Dialogs */}
      <GameOverModal
        status={engine.status}
        winner={engine.winner}
        opponent={opponent}
        theme={currentTheme}
        onPlayAgain={engine.resetRound}
        onReviewMatch={() => {
          sound.playClick();
          setIsGameOverModalOpen(false);
          setIsReplayOpen(true);
        }}
        onClose={() => setIsGameOverModalOpen(false)}
      />

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

      {isAuthModalOpen && (
        <AuthModal
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={() => setIsProfileModalOpen(true)}
        />
      )}

      {isProfileModalOpen && (
        <ProfileModal
          onClose={() => setIsProfileModalOpen(false)}
          onOpenOnlineLobby={() => setIsOnlineLobbyOpen(true)}
        />
      )}

      {isOnlineLobbyOpen && (
        <OnlineLobbyModal
          onClose={() => setIsOnlineLobbyOpen(false)}
          onEnterOnlineMatch={(room) => {
            sound.playClick();
            setActiveOnlineRoom(room);
            setLocalPlayerMark(profile && profile.uid === room.hostId ? 'X' : 'O');
            setMode(room.mode);
            engine.setBoard(room.board);
            engine.setCurrentPlayer(room.currentTurn);
            engine.setStatus(room.status === 'completed' ? (room.winner === 'draw' ? 'draw' : 'won') : 'playing');
            engine.setWinner(room.winner === 'draw' ? null : (room.winner as Player | null));
            engine.setWinningLine(room.winningLine || null);
          }}
          onRequireAuth={() => setIsAuthModalOpen(true)}
        />
      )}

      {/* Google Redirect Authenticating Overlay */}
      {redirectLoading && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center animate-in fade-in">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 animate-spin">
            <span className="text-2xl">⏳</span>
          </div>
          <h3 className="font-display text-lg font-bold text-white mb-1">
            Connecting Google Account...
          </h3>
          <p className="text-xs text-slate-400">
            Finalizing your login and syncing your Apex challenger profile
          </p>
        </div>
      )}
    </div>
  );
}
