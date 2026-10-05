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
import { THEMES, customPaletteToTheme } from './utils/theme';
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
import { ProfileModal } from './components/ProfileModal';
import { OnlineLobbyModal } from './components/OnlineLobbyModal';
import { GameChat } from './components/GameChat';
import { PaletteBuilderModal } from './components/PaletteBuilderModal';
import {
  ensureAuthenticatedUser,
  fetchProfileFromFirestore,
  saveProfileToFirestore,
  getCachedProfile,
  cacheProfile,
  getOrCreateLocalProfile,
  subscribeToOnlineRoom,
  submitOnlineMove,
  sendOnlineEmote,
  requestOnlineRematch,
  testFirebaseConnection,
  saveCustomPaletteToProfile,
  deleteCustomPaletteFromProfile,
  setActivePaletteInProfile,
} from './utils/firebase';
import { UserProfile, OnlineRoom, CustomPalette } from './types/game';
import { checkWin, isBoardFull } from './utils/ai';
import { Radio, Users, Globe, Smile, LogOut, Settings } from 'lucide-react';

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
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isOnlineLobbyOpen, setIsOnlineLobbyOpen] = useState<boolean>(false);
  const [isPaletteStudioOpen, setIsPaletteStudioOpen] = useState<boolean>(false);

  // Online Multiplayer State: guaranteed non-null so Online lobby is instant
  const [userProfile, setUserProfile] = useState<UserProfile>(() => getOrCreateLocalProfile());
  const [activeOnlineRoom, setActiveOnlineRoom] = useState<OnlineRoom | null>(null);
  const [onlineUserMark, setOnlineUserMark] = useState<'X' | 'O'>('X');
  const [onlineEmoteDisplay, setOnlineEmoteDisplay] = useState<{ senderName: string; emoji: string } | null>(null);

  // Initialize Firebase Auth & sync with Firestore
  useEffect(() => {
    testFirebaseConnection();
    ensureAuthenticatedUser()
      .then(async (user) => {
        if (!user) return;
        const firestoreProf = await fetchProfileFromFirestore(user.uid);
        if (firestoreProf) {
          setUserProfile(firestoreProf);
          cacheProfile(firestoreProf);
        } else {
          setUserProfile((current) => {
            const linkedProf: UserProfile = {
              ...current,
              uid: user.uid,
              displayName: user.displayName || current.displayName,
              email: user.email || current.email,
              username: user.email ? user.email.split('@')[0].replace(/[^a-z0-9_]/g, '') : current.username,
            };
            cacheProfile(linkedProf);
            saveProfileToFirestore(linkedProf).catch(() => {});
            return linkedProf;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Synchronize Active Online Room State via Firestore Listener
  useEffect(() => {
    if (!activeOnlineRoom?.id) return;

    const unsubscribe = subscribeToOnlineRoom(activeOnlineRoom.id, (updatedRoom) => {
      setActiveOnlineRoom(updatedRoom);

      // Synchronize Board & Engine state
      engine.setBoard(updatedRoom.board);
      engine.setCurrentPlayer(updatedRoom.currentTurn);
      if (updatedRoom.xPieceIndices) engine.setXPieceIndices(updatedRoom.xPieceIndices);
      if (updatedRoom.oPieceIndices) engine.setOPieceIndices(updatedRoom.oPieceIndices);

      if (updatedRoom.winner) {
        engine.setStatus(updatedRoom.winner === 'draw' ? 'draw' : 'won');
        engine.setWinner(updatedRoom.winner === 'draw' ? null : updatedRoom.winner);
        if (updatedRoom.winningLine) engine.setWinningLine(updatedRoom.winningLine);
      } else {
        engine.setStatus('playing');
        engine.setWinner(null);
        engine.setWinningLine(null);
      }

      // Floating Emote reaction notification
      if (updatedRoom.lastEmote && Date.now() - updatedRoom.lastEmote.timestamp < 3500) {
        setOnlineEmoteDisplay({
          senderName: updatedRoom.lastEmote.senderName,
          emoji: updatedRoom.lastEmote.emoji,
        });
        sound.playTick();
        setTimeout(() => setOnlineEmoteDisplay(null), 3500);
      }
    });

    return () => unsubscribe();
  }, [activeOnlineRoom?.id]);

  // Atmosphere transition
  const [transitionKey, setTransitionKey] = useState<number>(0);
  const [transitionColor, setTransitionColor] = useState<string>('#06b6d4');
  const isInitialMount = useRef<boolean>(true);

  // OS Dark Mode Preference
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const isDarkMode = colorMode === 'dark' || (colorMode === 'system' && systemPrefersDark);
  const activeCustomPalette = userProfile.customPalettes?.find(
    (p) => p.id === themeId || p.id === userProfile.activePaletteId
  );
  const currentTheme = activeCustomPalette
    ? customPaletteToTheme(activeCustomPalette)
    : THEMES[themeId] || THEMES['cyber-neon'];

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

  // Handle Cell Click (Local & Online)
  const handleCellClick = (index: number) => {
    if (opponent === 'online') {
      if (!activeOnlineRoom) {
        setIsOnlineLobbyOpen(true);
        return;
      }
      if (activeOnlineRoom.status !== 'playing') {
        return;
      }
      // Check turn
      if (activeOnlineRoom.currentTurn !== onlineUserMark) {
        sound.playTick();
        return;
      }
      if (activeOnlineRoom.board[index] !== null) {
        return;
      }

      const nextBoard = [...activeOnlineRoom.board];
      nextBoard[index] = onlineUserMark;
      sound.playMove(onlineUserMark);

      // Handle infinite pieces
      let nextXPieces = [...(activeOnlineRoom.xPieceIndices || [])];
      let nextOPieces = [...(activeOnlineRoom.oPieceIndices || [])];
      if (mode === 'infinite3') {
        if (onlineUserMark === 'X') {
          if (nextXPieces.length >= 3) {
            const removed = nextXPieces.shift();
            if (removed !== undefined) {
              nextBoard[removed] = null;
              sound.playDisappear();
            }
          }
          nextXPieces.push(index);
        } else {
          if (nextOPieces.length >= 3) {
            const removed = nextOPieces.shift();
            if (removed !== undefined) {
              nextBoard[removed] = null;
              sound.playDisappear();
            }
          }
          nextOPieces.push(index);
        }
      }

      const win = checkWin(nextBoard, mode);
      const full = mode !== 'infinite3' && isBoardFull(nextBoard);
      const nextTurn = onlineUserMark === 'X' ? 'O' : 'X';

      submitOnlineMove(
        activeOnlineRoom.id,
        nextBoard,
        nextTurn,
        index,
        nextXPieces,
        nextOPieces,
        win ? onlineUserMark : full ? 'draw' : null,
        win || null
      );

      // If game ends, update lifetime profile stats
      if (win || full) {
        if (userProfile) {
          const isWinner = Boolean(win);
          const updatedProf: UserProfile = {
            ...userProfile,
            totalGames: userProfile.totalGames + 1,
            wins: isWinner ? userProfile.wins + 1 : userProfile.wins,
            losses: userProfile.losses,
            draws: full && !win ? userProfile.draws + 1 : userProfile.draws,
            bestStreak: isWinner
              ? Math.max(userProfile.bestStreak, (userProfile.wins || 0) + 1)
              : userProfile.bestStreak,
            updatedAt: new Date().toISOString(),
          };
          setUserProfile(updatedProf);
          saveProfileToFirestore(updatedProf).catch(() => {});
        }
      }
      return;
    }

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

      {/* Floating Online Emote Notification Banner */}
      {onlineEmoteDisplay && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-slate-900/95 dark:bg-slate-900/95 text-white border border-cyan-500/50 shadow-2xl flex items-center gap-2 text-sm font-bold animate-bounce pointer-events-none">
          <span className="text-cyan-400">{onlineEmoteDisplay.senderName}:</span>
          <span className="text-2xl">{onlineEmoteDisplay.emoji}</span>
        </div>
      )}

      {/* Navigation Bar */}
      <Navbar
        currentMode={mode}
        onSelectMode={(newMode) => {
          sound.playClick();
          setMode(newMode);
        }}
        onOpenOnline={() => {
          sound.playClick();
          setIsOnlineLobbyOpen(true);
        }}
        onOpenProfile={() => {
          sound.playClick();
          setIsProfileModalOpen(true);
        }}
        profile={userProfile}
        isOnlineActive={opponent === 'online' && activeOnlineRoom?.status === 'playing'}
      />

      {/* Main Game Center */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-2.5 sm:px-4 py-2.5 sm:py-6 max-w-4xl mx-auto w-full">
        {/* Active Online Battle HUD Bar */}
        {opponent === 'online' && activeOnlineRoom && (
          <div className="w-full max-w-xl mx-auto mb-4 p-3 bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-cyan-500/40 shadow-lg flex flex-wrap items-center justify-between gap-2.5 backdrop-blur-xl animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100">
                <span>Room: </span>
                <span className="text-cyan-500 tracking-wider">{activeOnlineRoom.id}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-500/30">
                You: {onlineUserMark}
              </span>
            </div>

            {/* In-Game Quick Emotes */}
            <div className="flex items-center gap-1">
              {['🔥', '👏', '🧠', '⚔️', 'GG'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    sendOnlineEmote(
                      activeOnlineRoom.id,
                      userProfile?.uid || 'anon',
                      userProfile?.displayName || 'Player',
                      emoji
                    );
                  }}
                  className="px-2 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
                  title={`Send ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Leave Room Button */}
            <button
              onClick={() => {
                sound.playClick();
                setActiveOnlineRoom(null);
                setOpponent('bot');
              }}
              className="text-xs text-rose-500 hover:text-rose-400 font-semibold px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              Exit Match
            </button>
          </div>
        )}

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
          playerXLabel={
            opponent === 'bot'
              ? 'You'
              : opponent === 'online'
              ? activeOnlineRoom?.hostName
                ? `${activeOnlineRoom.hostName}${onlineUserMark === 'X' ? ' (You)' : ''}`
                : 'Host (X)'
              : 'Player X'
          }
          playerOLabel={
            opponent === 'bot'
              ? 'Gemini'
              : opponent === 'online'
              ? activeOnlineRoom?.guestName
                ? `${activeOnlineRoom.guestName}${onlineUserMark === 'O' ? ' (You)' : ''}`
                : 'Waiting...'
              : 'Player O'
          }
          onlineRoomCode={opponent === 'online' ? activeOnlineRoom?.id : null}
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
            if (newOpponent === 'online') {
              setIsOnlineLobbyOpen(true);
            } else {
              setActiveOnlineRoom(null);
              setOpponent(newOpponent);
              engine.resetRound();
            }
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
          canHint={engine.status === 'playing' && !engine.isBotThinking && opponent !== 'online'}
          gameMode={mode}
          onOpenOnlineLobby={() => setIsOnlineLobbyOpen(true)}
        />
      </main>

      {/* Real-time In-Game Live Chat for Online Multiplayer */}
      {opponent === 'online' && activeOnlineRoom && (
        <GameChat
          roomId={activeOnlineRoom.id}
          userProfile={userProfile}
          messages={activeOnlineRoom.messages || []}
          opponentName={
            onlineUserMark === 'X'
              ? activeOnlineRoom.guestName || 'Challenger'
              : activeOnlineRoom.hostName || 'Host'
          }
        />
      )}

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
          playerXName={
            opponent === 'online'
              ? activeOnlineRoom?.hostName || 'Host'
              : 'Player X'
          }
          playerOName={
            opponent === 'online'
              ? activeOnlineRoom?.guestName || 'Challenger'
              : 'Player O'
          }
          onPlayAgain={() => {
            if (opponent === 'online' && activeOnlineRoom) {
              const cells = mode === 'grid6x6' ? 36 : mode === 'grid4x4' ? 16 : 9;
              requestOnlineRematch(activeOnlineRoom.id, userProfile?.uid || 'anon', cells);
              setIsGameOverModalOpen(false);
            } else {
              engine.resetRound();
            }
          }}
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
          userProfile={userProfile}
          onOpenPaletteStudio={() => {
            setIsSettingsOpen(false);
            setIsPaletteStudioOpen(true);
          }}
          onSelectCustomPalette={(cp) => {
            sound.playClick();
            setThemeId(cp.id);
            savePrefs({ themeId: cp.id });
            setActivePaletteInProfile(userProfile, cp.id).then(setUserProfile);
          }}
          onDeleteCustomPalette={(id) => {
            sound.playClick();
            deleteCustomPaletteFromProfile(userProfile, id).then((p) => {
              setUserProfile(p);
              if (themeId === id) {
                setThemeId('cyber-neon');
                savePrefs({ themeId: 'cyber-neon' });
              }
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

      {/* Gamer Profile Creation & Customization Modal */}
      {isProfileModalOpen && (
        <ProfileModal
          currentProfile={userProfile}
          onSaveProfile={(updated) => {
            setUserProfile(updated);
            cacheProfile(updated);
          }}
          onOpenPaletteStudio={() => {
            setIsProfileModalOpen(false);
            setIsPaletteStudioOpen(true);
          }}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}

      {/* Custom Palette Studio Modal */}
      {isPaletteStudioOpen && (
        <PaletteBuilderModal
          userProfile={userProfile}
          activePaletteId={themeId}
          onSavePalette={async (palette) => {
            const updated = await saveCustomPaletteToProfile(userProfile, palette);
            setUserProfile(updated);
            setThemeId(palette.id);
            savePrefs({ themeId: palette.id });
          }}
          onDeletePalette={async (paletteId) => {
            const updated = await deleteCustomPaletteFromProfile(userProfile, paletteId);
            setUserProfile(updated);
            if (themeId === paletteId) {
              setThemeId('cyber-neon');
              savePrefs({ themeId: 'cyber-neon' });
            }
          }}
          onSelectPalette={(palette) => {
            if (palette) {
              setThemeId(palette.id);
              savePrefs({ themeId: palette.id });
              setActivePaletteInProfile(userProfile, palette.id).then(setUserProfile);
            } else {
              setThemeId('cyber-neon');
              savePrefs({ themeId: 'cyber-neon' });
              setActivePaletteInProfile(userProfile, null).then(setUserProfile);
            }
          }}
          onClose={() => setIsPaletteStudioOpen(false)}
        />
      )}

      {/* Online Multiplayer Matchmaking Lobby Modal */}
      {isOnlineLobbyOpen && (
        <OnlineLobbyModal
          userProfile={userProfile}
          onOpenProfile={() => {
            setIsOnlineLobbyOpen(false);
            setIsProfileModalOpen(true);
          }}
          onRoomJoined={(room, isHost) => {
            setActiveOnlineRoom(room);
            setOnlineUserMark(isHost ? 'X' : 'O');
            setMode(room.mode);
            setOpponent('online');
            setIsOnlineLobbyOpen(false);
          }}
          onClose={() => setIsOnlineLobbyOpen(false)}
        />
      )}

      {/* Real-Time In-Game Battle Chat (Available during online match or room) */}
      {opponent === 'online' && activeOnlineRoom && (
        <GameChat
          roomId={activeOnlineRoom.id}
          userProfile={userProfile}
          messages={activeOnlineRoom.messages || []}
          opponentName={
            onlineUserMark === 'X'
              ? activeOnlineRoom.guestName || 'Opponent'
              : activeOnlineRoom.hostName || 'Host'
          }
        />
      )}

      {/* Floating Settings Button (Right side at the very bottom) */}
      <button
        onClick={() => {
          sound.playClick();
          setIsSettingsOpen(true);
        }}
        aria-label="Arena Settings & Themes"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 p-3 sm:px-4 sm:py-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 hover:border-cyan-500/60 shadow-[0_8px_30px_rgba(0,0,0,0.2)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer backdrop-blur-xl group"
        title="Open Arena Settings"
      >
        <Settings className="w-5 h-5 text-cyan-500 dark:text-cyan-400 group-hover:rotate-90 transition-transform duration-500 shrink-0" />
        <span className="text-xs font-bold hidden sm:inline text-slate-700 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-300">
          Settings
        </span>
      </button>
    </div>
  );
}
