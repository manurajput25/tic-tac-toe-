/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Player,
  CellValue,
  GameMode,
  OpponentType,
  BotDifficulty,
  WinningLine as WinningLineType,
  GameStatus,
  GameScore,
  ThemeId,
  ColorMode,
  MoveRecord,
  BoardCustomization,
  BackgroundCustomization,
} from './types/game';
import { THEMES, BACKGROUND_THEMES } from './utils/theme';
import { sound } from './utils/audio';
import { checkWin, isBoardFull, getBestMove3x3, getBestMoveInfinite, getBestMove4x4, getHintMove } from './utils/ai';
import { triggerConfetti } from './utils/confetti';
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
import { useAuth } from './context/AuthContext';
import { MatchRoom } from './types/user';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { OnlineLobbyModal } from './components/OnlineLobbyModal';
import { OnlineMatchBanner } from './components/OnlineMatchBanner';
import {
  subscribeToRoom,
  makeOnlineMove,
  leaveOnlineRoom,
  resetOnlineMatch,
} from './services/multiplayerService';
import { Sparkles, Trophy, Lightbulb } from 'lucide-react';

const SCORE_STORAGE_KEY = 'apex_ttt_scores_v1';
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
  // Game Setup States
  const [mode, setMode] = useState<GameMode>('classic3x3');
  const [opponent, setOpponent] = useState<OpponentType>('bot');
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('unbeatable');
  const [themeId, setThemeId] = useState<ThemeId>('cyber-neon');
  const [colorMode, setColorMode] = useState<ColorMode>('dark');
  const [boardCustomization, setBoardCustomization] = useState<BoardCustomization>(DEFAULT_BOARD_CUSTOMIZATION);
  const [backgroundCustomization, setBackgroundCustomization] = useState<BackgroundCustomization>(DEFAULT_BACKGROUND_CUSTOMIZATION);
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });
  const [startingPlayer, setStartingPlayer] = useState<'X' | 'O' | 'alternate'>('alternate');
  const [blitzDuration, setBlitzDuration] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());

  // Subtle screen-wide atmosphere transition state
  const [transitionKey, setTransitionKey] = useState<number>(0);
  const [transitionColor, setTransitionColor] = useState<string>('#06b6d4');
  const isInitialMount = useRef<boolean>(true);

  // Compute active dark mode state
  const isDarkMode = colorMode === 'dark' || (colorMode === 'system' && systemPrefersDark);

  // Trigger subtle screen-wide transition overlay on theme or background customization change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const color = THEMES[themeId]?.xColor || '#06b6d4';
    setTransitionColor(color);
    setTransitionKey((prev) => prev + 1);
  }, [
    themeId,
    colorMode,
    boardCustomization.style,
    boardCustomization.cellFinish,
    boardCustomization.markStyle,
    backgroundCustomization.bgTheme,
    backgroundCustomization.style,
  ]);

  // Sync document root and body classes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    }
  }, [isDarkMode]);

  // Listen to OS system color scheme changes
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  // Active Match States
  const totalCells = mode === 'grid4x4' ? 16 : 9;
  const [board, setBoard] = useState<CellValue[]>(() => Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [status, setStatus] = useState<GameStatus>('playing');
  const [winningLine, setWinningLine] = useState<WinningLineType | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [moves, setMoves] = useState<MoveRecord[]>([]);

  // Infinite 3-Piece Mode queues (track move order of each player)
  const [xPieceIndices, setXPieceIndices] = useState<number[]>([]);
  const [oPieceIndices, setOPieceIndices] = useState<number[]>([]);

  // Assistant & AI states
  const [isBotThinking, setIsBotThinking] = useState<boolean>(false);
  const [hintIndex, setHintIndex] = useState<number | null>(null);
  const [blitzTimeLeft, setBlitzTimeLeft] = useState<number | null>(null);

  // Score & Metrics
  const [score, setScore] = useState<GameScore>(() => {
    try {
      const saved = localStorage.getItem(SCORE_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return { playerX: 0, playerO: 0, draws: 0, currentStreak: 0, bestStreak: 0 };
  });

  // Modal Dialogs
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);
  const [isReplayOpen, setIsReplayOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);

  // User Profile & Online Multiplayer States
  const { user, profile, redirectLoading, recordGameResult } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isOnlineLobbyOpen, setIsOnlineLobbyOpen] = useState<boolean>(false);
  const [activeOnlineRoom, setActiveOnlineRoom] = useState<MatchRoom | null>(null);
  const [localPlayerMark, setLocalPlayerMark] = useState<Player>('X');

  // Current theme config
  const currentTheme = THEMES[themeId] || THEMES['cyber-neon'];

  // Save scores to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(score));
    } catch {
      // ignore
    }
  }, [score]);

  // Load preferences
  useEffect(() => {
    try {
      const savedPrefs = localStorage.getItem(PREFS_STORAGE_KEY);
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs);
        if (parsed.themeId && THEMES[parsed.themeId as ThemeId]) {
          setThemeId(parsed.themeId as ThemeId);
        }
        if (parsed.colorMode && (parsed.colorMode === 'light' || parsed.colorMode === 'dark' || parsed.colorMode === 'system')) {
          setColorMode(parsed.colorMode as ColorMode);
        }
        if (parsed.boardCustomization) {
          setBoardCustomization((prev) => ({ ...prev, ...parsed.boardCustomization }));
        }
        if (parsed.backgroundCustomization) {
          setBackgroundCustomization((prev) => ({ ...prev, ...parsed.backgroundCustomization }));
        }
        if (parsed.botDifficulty) setBotDifficulty(parsed.botDifficulty);
        if (parsed.blitzDuration !== undefined) setBlitzDuration(parsed.blitzDuration);
        if (parsed.startingPlayer) setStartingPlayer(parsed.startingPlayer);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save preferences
  const savePrefs = (updates: Partial<{
    themeId: ThemeId;
    colorMode: ColorMode;
    botDifficulty: BotDifficulty;
    blitzDuration: number | null;
    startingPlayer: 'X' | 'O' | 'alternate';
    boardCustomization: BoardCustomization;
    backgroundCustomization: BackgroundCustomization;
  }>) => {
    try {
      const prev = localStorage.getItem(PREFS_STORAGE_KEY);
      const parsed = prev ? JSON.parse(prev) : {};
      const current = {
        ...parsed,
        themeId,
        colorMode,
        botDifficulty,
        blitzDuration,
        startingPlayer,
        boardCustomization,
        backgroundCustomization,
        ...updates,
      };
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(current));
    } catch {
      // ignore
    }
  };

  // Update board customization
  const handleUpdateBoardCustomization = (updates: Partial<BoardCustomization>) => {
    sound.playClick();
    setBoardCustomization((prev) => {
      const updated = { ...prev, ...updates };
      savePrefs({ boardCustomization: updated });
      return updated;
    });
  };

  // Update background customization
  const handleUpdateBackgroundCustomization = (updates: Partial<BackgroundCustomization>) => {
    sound.playClick();
    setBackgroundCustomization((prev) => {
      const updated = { ...prev, ...updates };
      savePrefs({ backgroundCustomization: updated });
      return updated;
    });
  };

  // Cycle color mode (light -> dark -> system)
  const handleCycleColorMode = () => {
    sound.playClick();
    const nextMode: ColorMode = colorMode === 'dark' ? 'light' : colorMode === 'light' ? 'system' : 'dark';
    setColorMode(nextMode);
    savePrefs({ colorMode: nextMode });
  };

  // Reset/Start a new round
  const startNewRound = useCallback((newMode?: GameMode, keepStreaks: boolean = true) => {
    const activeMode = newMode || mode;
    const cellCount = activeMode === 'grid4x4' ? 16 : 9;

    setBoard(Array(cellCount).fill(null));
    setWinningLine(null);
    setWinner(null);
    setStatus('playing');
    setMoves([]);
    setXPieceIndices([]);
    setOPieceIndices([]);
    setHintIndex(null);
    setIsBotThinking(false);
    setIsGameOverModalOpen(false);

    // Starting player logic
    let starter: Player = 'X';
    if (startingPlayer === 'O') {
      starter = 'O';
    } else if (startingPlayer === 'alternate') {
      starter = roundNumber % 2 === 1 ? 'X' : 'O';
    }
    setCurrentPlayer(starter);

    if (blitzDuration !== null) {
      setBlitzTimeLeft(blitzDuration);
    } else {
      setBlitzTimeLeft(null);
    }
  }, [mode, startingPlayer, roundNumber, blitzDuration]);

  // Switch Game Mode
  const handleSelectMode = (newMode: GameMode) => {
    sound.playClick();
    setMode(newMode);
    startNewRound(newMode);
  };

  // Subscribe to real-time online match updates
  useEffect(() => {
    if (!activeOnlineRoom) return;

    const unsubscribe = subscribeToRoom(activeOnlineRoom.id, (updatedRoom) => {
      if (!updatedRoom || updatedRoom.status === 'abandoned') {
        setActiveOnlineRoom(null);
        startNewRound();
        return;
      }

      setActiveOnlineRoom(updatedRoom);
      setBoard(updatedRoom.board);
      setCurrentPlayer(updatedRoom.currentTurn);
      if (updatedRoom.xPieceIndices) setXPieceIndices(updatedRoom.xPieceIndices);
      if (updatedRoom.oPieceIndices) setOPieceIndices(updatedRoom.oPieceIndices);

      if (updatedRoom.winner !== undefined && updatedRoom.winner !== null) {
        setWinner(updatedRoom.winner === 'draw' ? null : updatedRoom.winner);
        setStatus(updatedRoom.winner === 'draw' ? 'draw' : 'won');
        setWinningLine(updatedRoom.winningLine || null);

        // Record stats once when game concludes
        if (updatedRoom.status === 'completed' && status !== 'won' && status !== 'draw') {
          if (updatedRoom.winner === localPlayerMark) {
            triggerConfetti();
            sound.playWin();
            recordGameResult('win');
          } else if (updatedRoom.winner === 'draw') {
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
  }, [activeOnlineRoom?.id, localPlayerMark, status]);

  const handleEnterOnlineMatch = (room: MatchRoom) => {
    sound.playClick();
    setActiveOnlineRoom(room);
    const mark: Player = user && user.uid === room.hostId ? 'X' : 'O';
    setLocalPlayerMark(mark);
    setMode(room.mode);
    setBoard(room.board);
    setCurrentPlayer(room.currentTurn);
    setStatus(room.status === 'completed' ? (room.winner === 'draw' ? 'draw' : 'won') : 'playing');
    setWinner(room.winner === 'draw' ? null : (room.winner as Player | null) || null);
    setWinningLine(room.winningLine || null);
  };

  const handleLeaveOnlineMatch = async () => {
    sound.playClick();
    if (activeOnlineRoom && user) {
      await leaveOnlineRoom(activeOnlineRoom.id, user.uid);
    }
    setActiveOnlineRoom(null);
    startNewRound();
  };

  const handleOnlineRematch = async () => {
    sound.playClick();
    if (activeOnlineRoom) {
      await resetOnlineMatch(activeOnlineRoom.id, activeOnlineRoom.mode);
    }
  };

  // Handle Blitz countdown
  useEffect(() => {
    if (blitzDuration === null || status !== 'playing' || isBotThinking) {
      return;
    }

    if (blitzTimeLeft === null) {
      setBlitzTimeLeft(blitzDuration);
      return;
    }

    if (blitzTimeLeft <= 0) {
      // Turn timed out: switch player or forfeit
      sound.playTick();
      setCurrentPlayer((prev) => (prev === 'X' ? 'O' : 'X'));
      setBlitzTimeLeft(blitzDuration);
      return;
    }

    const timer = setInterval(() => {
      setBlitzTimeLeft((prev) => {
        if (prev === null) return blitzDuration;
        if (prev <= 1) return 0;
        if (prev <= 4) sound.playTick();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [blitzDuration, blitzTimeLeft, status, isBotThinking]);

  // Execute a move on the board
  const executeMove = useCallback((index: number, playerToPlay?: Player) => {
    const activePlayer = playerToPlay || currentPlayer;

    setBoard((prevBoard) => {
      if (prevBoard[index] !== null || status !== 'playing') {
        return prevBoard;
      }

      const nextBoard = [...prevBoard];
      let removedIdx: number | undefined = undefined;

      // Handle Infinite 3-Piece disappearing logic
      if (mode === 'infinite3') {
        if (activePlayer === 'X') {
          if (xPieceIndices.length >= 3) {
            removedIdx = xPieceIndices[0];
            nextBoard[removedIdx] = null;
            sound.playDisappear();
          }
          setXPieceIndices((prev) => {
            const next = prev.length >= 3 ? [...prev.slice(1), index] : [...prev, index];
            return next;
          });
        } else {
          if (oPieceIndices.length >= 3) {
            removedIdx = oPieceIndices[0];
            nextBoard[removedIdx] = null;
            sound.playDisappear();
          }
          setOPieceIndices((prev) => {
            const next = prev.length >= 3 ? [...prev.slice(1), index] : [...prev, index];
            return next;
          });
        }
      }

      nextBoard[index] = activePlayer;

      // Sound & Haptic
      sound.playMove(activePlayer);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(14);
      }

      // Record move
      setMoves((prevMoves) => [
        ...prevMoves,
        {
          index,
          player: activePlayer,
          timestamp: Date.now(),
          removedIndex: removedIdx,
        },
      ]);

      // Check Win
      const win = checkWin(nextBoard, mode);
      if (win) {
        setWinningLine(win);
        setWinner(activePlayer);
        setStatus('won');

        // Victory fanfare & Confetti
        sound.playWin();
        triggerConfetti();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([30, 40, 70]);
        }

        // Update score
        setScore((prevScore) => {
          const isPlayerX = activePlayer === 'X';
          const newPlayerX = isPlayerX ? prevScore.playerX + 1 : prevScore.playerX;
          const newPlayerO = !isPlayerX ? prevScore.playerO + 1 : prevScore.playerO;
          const newCurrentStreak = isPlayerX ? prevScore.currentStreak + 1 : 0;
          const newBestStreak = Math.max(newCurrentStreak, prevScore.bestStreak);

          return {
            playerX: newPlayerX,
            playerO: newPlayerO,
            draws: prevScore.draws,
            currentStreak: newCurrentStreak,
            bestStreak: newBestStreak,
          };
        });

        setTimeout(() => {
          setIsGameOverModalOpen(true);
        }, 900);

        return nextBoard;
      }

      // Check Draw (only in classic and 4x4, since infinite3 never draws by filling)
      if (mode !== 'infinite3' && isBoardFull(nextBoard)) {
        setStatus('draw');
        sound.playDraw();

        setScore((prevScore) => ({
          ...prevScore,
          draws: prevScore.draws + 1,
          currentStreak: 0,
        }));

        setTimeout(() => {
          setIsGameOverModalOpen(true);
        }, 600);

        return nextBoard;
      }

      // Next Turn
      const nextPlayer: Player = activePlayer === 'X' ? 'O' : 'X';
      setCurrentPlayer(nextPlayer);
      setHintIndex(null);

      // Reset blitz timer for next player
      if (blitzDuration !== null) {
        setBlitzTimeLeft(blitzDuration);
      }

      return nextBoard;
    });
  }, [currentPlayer, status, mode, xPieceIndices, oPieceIndices, blitzDuration]);

  // Human click cell
  const handleCellClick = (index: number) => {
    // Online Multiplayer Match Move
    if (activeOnlineRoom) {
      if (activeOnlineRoom.status !== 'playing') return;
      if (activeOnlineRoom.currentTurn !== localPlayerMark) return; // Not your turn!
      if (board[index] !== null) return;

      const newBoard = [...board];
      newBoard[index] = localPlayerMark;

      let newXPieces = [...xPieceIndices];
      let newOPieces = [...oPieceIndices];

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
      let lineVal: WinningLineType | null = null;

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

    if (status !== 'playing' || isBotThinking) return;
    if (board[index] !== null) return;
    if (opponent === 'bot' && currentPlayer !== 'X') return;

    executeMove(index);
  };

  // Bot Turn Automation
  useEffect(() => {
    if (status !== 'playing') return;
    if (opponent !== 'bot') return;
    if (currentPlayer !== 'O') return;

    setIsBotThinking(true);

    const deliberationDelay = 350 + Math.random() * 300;

    const timer = setTimeout(() => {
      let botMove = -1;

      if (mode === 'grid4x4') {
        botMove = getBestMove4x4(board, 'O', botDifficulty);
      } else if (mode === 'infinite3') {
        botMove = getBestMoveInfinite(board, oPieceIndices, xPieceIndices, 'O', botDifficulty);
      } else {
        botMove = getBestMove3x3(board, 'O', botDifficulty);
      }

      setIsBotThinking(false);

      if (botMove !== -1 && board[botMove] === null) {
        executeMove(botMove, 'O');
      }
    }, deliberationDelay);

    return () => clearTimeout(timer);
  }, [currentPlayer, status, opponent, board, mode, botDifficulty, oPieceIndices, xPieceIndices, executeMove]);

  // Coach Hint calculation
  const handleGetHint = () => {
    sound.playClick();
    const suggested = getHintMove(board, currentPlayer, mode, xPieceIndices, oPieceIndices);
    if (suggested !== -1) {
      setHintIndex(suggested);
      // Auto-clear hint after 4s
      setTimeout(() => {
        setHintIndex((prev) => (prev === suggested ? null : prev));
      }, 4000);
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when modals are open
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

      // Reset round on 'r'
      if (e.key === 'r' || e.key === 'R') {
        sound.playClick();
        startNewRound();
        return;
      }

      // Hint on 'h'
      if (e.key === 'h' || e.key === 'H') {
        handleGetHint();
        return;
      }

      // Mute toggle on 'm'
      if (e.key === 'm' || e.key === 'M') {
        const muted = sound.toggleMute();
        setIsMuted(muted);
        return;
      }

      // Numpad & number row mapping for 3x3
      if (mode !== 'grid4x4') {
        // Standard Numpad gaming layout:
        // 7 8 9
        // 4 5 6
        // 1 2 3
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
          // Also top number row (1..9): 1 2 3 / 4 5 6 / 7 8 9
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
          const targetIndex = numpadMap[e.code];
          if (board[targetIndex] === null) {
            handleCellClick(targetIndex);
          }
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
    board,
    status,
    isBotThinking,
    startNewRound,
  ]);

  const bgThemeConfig =
    BACKGROUND_THEMES[backgroundCustomization.bgTheme] || BACKGROUND_THEMES['deep-space'];

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? bgThemeConfig.cssBg : 'bg-slate-100'
      } text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-700`}
    >
      {/* Interactive particle canvas background */}
      <ParticleBackground
        theme={currentTheme}
        isDark={isDarkMode}
        customization={backgroundCustomization}
      />

      {/* Background visual glow mesh */}
      {backgroundCustomization.showGlowOrbs && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div
            className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[140px] opacity-25 transition-all duration-700"
            style={{
              backgroundColor: bgThemeConfig.ambientOrbs.orb1,
            }}
          />
          <div
            className="absolute top-[40%] -left-[10%] w-[450px] h-[450px] rounded-full blur-[130px] opacity-20 transition-all duration-700"
            style={{
              backgroundColor: bgThemeConfig.ambientOrbs.orb2,
            }}
          />
          <div
            className="absolute -bottom-[10%] -right-[10%] w-[450px] h-[450px] rounded-full blur-[130px] opacity-20 transition-all duration-700"
            style={{
              backgroundColor: bgThemeConfig.ambientOrbs.orb3,
            }}
          />
        </div>
      )}

      {/* Subtle Screen-Wide Atmosphere Transition Bloom */}
      {transitionKey > 0 && (
        <div
          key={transitionKey}
          className="fixed inset-0 pointer-events-none z-30 animate-theme-bloom"
          aria-hidden="true"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${transitionColor}44 0%, ${transitionColor}18 50%, transparent 80%)`,
          }}
        />
      )}

      {/* Top Bar Navigation */}
      <Navbar
        currentMode={mode}
        onSelectMode={(newMode) => {
          if (activeOnlineRoom) return;
          handleSelectMode(newMode);
        }}
        isMuted={isMuted}
        onToggleMute={() => {
          const muted = sound.toggleMute();
          setIsMuted(muted);
        }}
        colorMode={colorMode}
        onCycleColorMode={handleCycleColorMode}
        onResetGame={() => {
          if (activeOnlineRoom) {
            handleOnlineRematch();
          } else {
            sound.playClick();
            startNewRound();
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

      {/* Main Game Arena */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-8 max-w-4xl mx-auto w-full">
        {/* Active Online Multiplayer Battle Banner */}
        {activeOnlineRoom && (
          <OnlineMatchBanner
            room={activeOnlineRoom}
            localPlayerMark={localPlayerMark}
            isMyTurn={activeOnlineRoom.currentTurn === localPlayerMark}
            onLeaveRoom={handleLeaveOnlineMatch}
            onRematch={handleOnlineRematch}
          />
        )}

        {/* HUD Scoreboard */}
        <ScoreBoard
          score={score}
          currentPlayer={currentPlayer}
          opponent={activeOnlineRoom ? 'pvp' : opponent}
          botDifficulty={botDifficulty}
          theme={currentTheme}
          blitzTimeLeft={blitzTimeLeft}
          blitzDuration={blitzDuration}
          roundNumber={roundNumber}
          isBotThinking={isBotThinking}
        />

        {/* Board Arena */}
        <Board
          board={board}
          mode={mode}
          theme={currentTheme}
          currentPlayer={currentPlayer}
          winningLine={winningLine}
          winner={winner}
          isGameOver={status !== 'playing'}
          isBotThinking={isBotThinking}
          hintIndex={hintIndex}
          xPieceIndices={xPieceIndices}
          oPieceIndices={oPieceIndices}
          customization={boardCustomization}
          onCellClick={handleCellClick}
        />

        {/* Game Mode Controls & Coach Hint */}
        <GameControls
          opponent={opponent}
          onChangeOpponent={(newOpponent) => {
            sound.playClick();
            setOpponent(newOpponent);
            startNewRound();
          }}
          botDifficulty={botDifficulty}
          onChangeDifficulty={(diff) => {
            sound.playClick();
            setBotDifficulty(diff);
            savePrefs({ botDifficulty: diff });
            startNewRound();
          }}
          onGetHint={handleGetHint}
          onResetRound={() => {
            sound.playClick();
            startNewRound();
          }}
          isGameOver={status !== 'playing'}
          canHint={!isBotThinking && status === 'playing'}
          gameMode={mode}
        />
      </main>

      {/* Quiet Footer */}
      <footer className="w-full border-t border-slate-200/80 dark:border-slate-900/80 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400 z-10">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Apex Tic-Tac-Toe · Modern Interactive Arena</span>
          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
            <button
              onClick={() => setIsRulesOpen(true)}
              className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              How to Play
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              Themes
            </button>
            <button
              onClick={() => setIsStatsOpen(true)}
              className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              Stats
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <GameOverModal
        status={status}
        winner={winner}
        opponent={opponent}
        theme={currentTheme}
        onPlayAgain={() => {
          sound.playClick();
          setRoundNumber((r) => r + 1);
          startNewRound();
        }}
        onReviewMatch={() => {
          sound.playClick();
          setIsGameOverModalOpen(false);
          setIsReplayOpen(true);
        }}
        onClose={() => setIsGameOverModalOpen(false)}
      />

      {isReplayOpen && (
        <ReplayViewer
          moves={moves}
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
            setBlitzTimeLeft(dur);
            savePrefs({ blitzDuration: dur });
          }}
          isMuted={isMuted}
          onToggleMute={() => {
            const muted = sound.toggleMute();
            setIsMuted(muted);
          }}
          startingPlayer={startingPlayer}
          onSelectStartingPlayer={(starter) => {
            sound.playClick();
            setStartingPlayer(starter);
            savePrefs({ startingPlayer: starter });
          }}
          boardCustomization={boardCustomization}
          onUpdateBoardCustomization={handleUpdateBoardCustomization}
          backgroundCustomization={backgroundCustomization}
          onUpdateBackgroundCustomization={handleUpdateBackgroundCustomization}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {isRulesOpen && <RulesModal onClose={() => setIsRulesOpen(false)} />}

      {isStatsOpen && (
        <StatsModal
          score={score}
          currentMode={mode}
          onResetStats={() => {
            sound.playClick();
            const resetScore = {
              playerX: 0,
              playerO: 0,
              draws: 0,
              currentStreak: 0,
              bestStreak: 0,
            };
            setScore(resetScore);
            localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(resetScore));
          }}
          onClose={() => setIsStatsOpen(false)}
        />
      )}

      {/* User Login & Authentication Modal */}
      {isAuthModalOpen && (
        <AuthModal
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={() => setIsProfileModalOpen(true)}
        />
      )}

      {/* User Profile & ID Customizer Modal */}
      {isProfileModalOpen && (
        <ProfileModal
          onClose={() => setIsProfileModalOpen(false)}
          onOpenOnlineLobby={() => setIsOnlineLobbyOpen(true)}
        />
      )}

      {/* Online Multiplayer Matchmaking Lobby */}
      {isOnlineLobbyOpen && (
        <OnlineLobbyModal
          onClose={() => setIsOnlineLobbyOpen(false)}
          onEnterOnlineMatch={handleEnterOnlineMatch}
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
