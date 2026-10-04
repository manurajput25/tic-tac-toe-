import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CellValue,
  Player,
  GameMode,
  OpponentType,
  BotDifficulty,
  WinningLine,
  GameStatus,
  GameScore,
  ModeScores,
  MoveRecord,
} from '../types/game';
import { sound } from '../utils/audio';
import { triggerConfetti } from '../utils/confetti';
import {
  checkWin,
  isBoardFull,
  getBestMove3x3,
  getBestMoveInfinite,
  getBestMove4x4,
  getBestMove6x6,
  getBestMove12x12,
  getHintMove,
} from '../utils/ai';

const SCORES_STORAGE_KEY = 'apex_ttt_scores_by_mode_v2';
const LEGACY_STORAGE_KEY = 'apex_ttt_scores_v1';

const defaultScore = (): GameScore => ({
  playerX: 0,
  playerO: 0,
  draws: 0,
  currentStreak: 0,
  bestStreak: 0,
});

const getCellCount = (m: GameMode): number =>
  m === 'grid12x12' ? 144 : m === 'grid6x6' ? 36 : m === 'grid4x4' ? 16 : 9;

export interface UseGameEngineOptions {
  mode: GameMode;
  opponent: OpponentType;
  botDifficulty: BotDifficulty;
  startingPlayer: 'X' | 'O' | 'alternate';
  blitzDuration: number | null;
  isOnlineActive?: boolean;
  onGameEnd?: (result: 'win' | 'loss' | 'draw') => void;
}

export function useGameEngine({
  mode,
  opponent,
  botDifficulty,
  startingPlayer,
  blitzDuration,
  isOnlineActive = false,
  onGameEnd,
}: UseGameEngineOptions) {
  const totalCells = getCellCount(mode);

  // Board & Match State
  const [board, setBoard] = useState<CellValue[]>(() => Array(totalCells).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [status, setStatus] = useState<GameStatus>('playing');
  const [winner, setWinner] = useState<Player | null>(null);
  const [winningLine, setWinningLine] = useState<WinningLine | null>(null);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [moves, setMoves] = useState<MoveRecord[]>([]);

  // Infinite 3-Piece Tracking
  const [xPieceIndices, setXPieceIndices] = useState<number[]>([]);
  const [oPieceIndices, setOPieceIndices] = useState<number[]>([]);

  // Assist & Timer
  const [isBotThinking, setIsBotThinking] = useState<boolean>(false);
  const [hintIndex, setHintIndex] = useState<number | null>(null);
  const [blitzTimeLeft, setBlitzTimeLeft] = useState<number | null>(blitzDuration);
  const [streakMilestone, setStreakMilestone] = useState<number | null>(null);

  // Score Tracking: Segregated across 'bot', 'pvp', and 'online'
  const [allScores, setAllScores] = useState<ModeScores>(() => {
    try {
      const saved = localStorage.getItem(SCORES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          bot: parsed.bot || defaultScore(),
          pvp: parsed.pvp || defaultScore(),
          online: parsed.online || defaultScore(),
        };
      }

      // Backward compatible migration from legacy single-score key
      const legacySaved = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacySaved) {
        const legacyScore = JSON.parse(legacySaved);
        return {
          bot: legacyScore,
          pvp: defaultScore(),
          online: defaultScore(),
        };
      }
    } catch {
      // ignore
    }
    return {
      bot: defaultScore(),
      pvp: defaultScore(),
      online: defaultScore(),
    };
  });

  // Current active mode score
  const score: GameScore = allScores[opponent] || defaultScore();

  // Save segregated scores to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SCORES_STORAGE_KEY, JSON.stringify(allScores));
    } catch {
      // ignore
    }
  }, [allScores]);

  // Update current mode score
  const setScore = useCallback(
    (updater: GameScore | ((prev: GameScore) => GameScore)) => {
      setAllScores((prev) => {
        const currentModeScore = prev[opponent] || defaultScore();
        const nextScore = typeof updater === 'function' ? updater(currentModeScore) : updater;
        return {
          ...prev,
          [opponent]: nextScore,
        };
      });
    },
    [opponent]
  );

  // Reset board when Game Mode changes
  useEffect(() => {
    const cells = getCellCount(mode);
    setBoard(Array(cells).fill(null));
    setXPieceIndices([]);
    setOPieceIndices([]);
    setWinningLine(null);
    setWinner(null);
    setStatus('playing');
    setMoves([]);
    setHintIndex(null);
    setIsBotThinking(false);
    setCurrentPlayer('X');
    setBlitzTimeLeft(blitzDuration);
  }, [mode]);

  // Determine starting player for round
  const getStartingPlayer = useCallback(
    (round: number): Player => {
      if (startingPlayer === 'O') return 'O';
      if (startingPlayer === 'alternate') return round % 2 === 1 ? 'X' : 'O';
      return 'X';
    },
    [startingPlayer]
  );

  // Start fresh round
  const resetRound = useCallback(() => {
    sound.playClick();
    const cells = getCellCount(mode);
    const nextRound = roundNumber + 1;

    setRoundNumber(nextRound);
    setBoard(Array(cells).fill(null));
    setWinningLine(null);
    setWinner(null);
    setStatus('playing');
    setMoves([]);
    setXPieceIndices([]);
    setOPieceIndices([]);
    setHintIndex(null);
    setIsBotThinking(false);
    setStreakMilestone(null);

    const starter = getStartingPlayer(nextRound);
    setCurrentPlayer(starter);
    setBlitzTimeLeft(blitzDuration);
  }, [mode, roundNumber, startingPlayer, blitzDuration, getStartingPlayer]);

  // Reset Scores for active mode
  const resetScores = useCallback(() => {
    sound.playClick();
    const cleared = defaultScore();
    setScore(cleared);
    resetRound();
  }, [resetRound, setScore]);

  // Core Move Execution Engine (Pure, clean, atomic)
  const applyMove = useCallback(
    (index: number, playerToMove: Player): boolean => {
      if (status !== 'playing' || board[index] !== null) {
        return false;
      }

      const nextBoard = [...board];
      let removedIndex: number | undefined = undefined;
      let nextXPieces = [...xPieceIndices];
      let nextOPieces = [...oPieceIndices];

      // Handle Infinite 3-Piece rule
      if (mode === 'infinite3') {
        if (playerToMove === 'X') {
          if (nextXPieces.length >= 3) {
            removedIndex = nextXPieces.shift();
            if (removedIndex !== undefined) {
              nextBoard[removedIndex] = null;
              sound.playDisappear();
            }
          }
          nextXPieces.push(index);
        } else {
          if (nextOPieces.length >= 3) {
            removedIndex = nextOPieces.shift();
            if (removedIndex !== undefined) {
              nextBoard[removedIndex] = null;
              sound.playDisappear();
            }
          }
          nextOPieces.push(index);
        }
      }

      // Place piece
      nextBoard[index] = playerToMove;
      sound.playMove(playerToMove);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(15);
      }

      // Update Move history
      const newMoveRecord: MoveRecord = {
        index,
        player: playerToMove,
        timestamp: Date.now(),
        removedIndex,
      };

      // Check Win Condition
      const win = checkWin(nextBoard, mode);
      const full = mode !== 'infinite3' && isBoardFull(nextBoard);

      if (win) {
        // WINNER!
        setBoard(nextBoard);
        setXPieceIndices(nextXPieces);
        setOPieceIndices(nextOPieces);
        setMoves((prev) => [...prev, newMoveRecord]);
        setWinner(playerToMove);
        setWinningLine(win);
        setStatus('won');
        setHintIndex(null);

        const isX = playerToMove === 'X';
        const newStreak = isX ? score.currentStreak + 1 : 0;

        if (newStreak === 3) {
          // Special 3-win streak milestone! Trigger distinct inferno sequence
          setStreakMilestone(3);
        } else {
          // Standard single-round win confetti
          sound.playWin();
          triggerConfetti();
        }

        // Update score
        setScore((prev) => {
          const newPlayerX = isX ? prev.playerX + 1 : prev.playerX;
          const newPlayerO = !isX ? prev.playerO + 1 : prev.playerO;
          return {
            playerX: newPlayerX,
            playerO: newPlayerO,
            draws: prev.draws,
            currentStreak: newStreak,
            bestStreak: Math.max(newStreak, prev.bestStreak),
          };
        });

        if (onGameEnd) {
          onGameEnd(playerToMove === 'X' ? 'win' : 'loss');
        }
        return true;
      }

      if (full) {
        // DRAW!
        setBoard(nextBoard);
        setXPieceIndices(nextXPieces);
        setOPieceIndices(nextOPieces);
        setMoves((prev) => [...prev, newMoveRecord]);
        setStatus('draw');
        setHintIndex(null);
        sound.playDraw();

        setScore((prev) => ({
          ...prev,
          draws: prev.draws + 1,
        }));

        if (onGameEnd) {
          onGameEnd('draw');
        }
        return true;
      }

      // ONGOING GAME: Switch to next player
      const nextPlayer: Player = playerToMove === 'X' ? 'O' : 'X';
      setBoard(nextBoard);
      setXPieceIndices(nextXPieces);
      setOPieceIndices(nextOPieces);
      setMoves((prev) => [...prev, newMoveRecord]);
      setCurrentPlayer(nextPlayer);
      setHintIndex(null);

      if (blitzDuration !== null) {
        setBlitzTimeLeft(blitzDuration);
      }

      return true;
    },
    [board, status, mode, xPieceIndices, oPieceIndices, blitzDuration, onGameEnd]
  );

  // Player click on a cell
  const makeMove = useCallback(
    (index: number) => {
      if (isOnlineActive || status !== 'playing' || isBotThinking) {
        return;
      }
      if (opponent === 'bot' && currentPlayer !== 'X') {
        return; // Bot's turn
      }
      applyMove(index, currentPlayer);
    },
    [isOnlineActive, status, isBotThinking, opponent, currentPlayer, applyMove]
  );

  // Undo last move (in local PvP or vs Bot)
  const undoLastMove = useCallback(() => {
    if (isOnlineActive || moves.length === 0 || status === 'won') {
      return;
    }
    sound.playClick();

    // In Bot mode, undo both human and bot move to return to human's turn
    const stepCount = opponent === 'bot' && moves.length >= 2 ? 2 : 1;
    const remainingMoves = moves.slice(0, moves.length - stepCount);

    // Replay board from scratch to guarantee pure state
    const cells = getCellCount(mode);
    const restoredBoard: CellValue[] = Array(cells).fill(null);
    let xPieces: number[] = [];
    let oPieces: number[] = [];

    for (const m of remainingMoves) {
      if (mode === 'infinite3') {
        if (m.player === 'X') {
          if (xPieces.length >= 3) {
            const oldest = xPieces.shift()!;
            restoredBoard[oldest] = null;
          }
          xPieces.push(m.index);
        } else {
          if (oPieces.length >= 3) {
            const oldest = oPieces.shift()!;
            restoredBoard[oldest] = null;
          }
          oPieces.push(m.index);
        }
      }
      restoredBoard[m.index] = m.player;
    }

    setBoard(restoredBoard);
    setXPieceIndices(xPieces);
    setOPieceIndices(oPieces);
    setMoves(remainingMoves);
    setStatus('playing');
    setWinner(null);
    setWinningLine(null);
    setHintIndex(null);

    const nextP: Player = remainingMoves.length % 2 === 0 ? 'X' : 'O';
    setCurrentPlayer(nextP);
  }, [isOnlineActive, moves, status, opponent, mode]);

  // AI Bot Automated Turn
  useEffect(() => {
    if (isOnlineActive || status !== 'playing' || opponent !== 'bot' || currentPlayer !== 'O') {
      return;
    }

    setIsBotThinking(true);
    const delay = 320 + Math.random() * 220;

    const timer = setTimeout(() => {
      let botMove = -1;
      if (mode === 'grid12x12') {
        botMove = getBestMove12x12(board, 'O', botDifficulty);
      } else if (mode === 'grid6x6') {
        botMove = getBestMove6x6(board, 'O', botDifficulty);
      } else if (mode === 'grid4x4') {
        botMove = getBestMove4x4(board, 'O', botDifficulty);
      } else if (mode === 'infinite3') {
        botMove = getBestMoveInfinite(board, oPieceIndices, xPieceIndices, 'O', botDifficulty);
      } else {
        botMove = getBestMove3x3(board, 'O', botDifficulty);
      }

      setIsBotThinking(false);

      if (botMove !== -1 && board[botMove] === null) {
        applyMove(botMove, 'O');
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      setIsBotThinking(false);
    };
  }, [
    isOnlineActive,
    status,
    opponent,
    currentPlayer,
    board,
    mode,
    botDifficulty,
    oPieceIndices,
    xPieceIndices,
    applyMove,
  ]);

  // Blitz Timer Countdown
  useEffect(() => {
    if (isOnlineActive || blitzDuration === null || status !== 'playing' || isBotThinking) {
      return;
    }

    if (blitzTimeLeft === null) {
      setBlitzTimeLeft(blitzDuration);
      return;
    }

    if (blitzTimeLeft <= 0) {
      // Turn timed out: auto-switch turn
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
  }, [isOnlineActive, blitzDuration, blitzTimeLeft, status, isBotThinking]);

  // Get Move Hint
  const requestHint = useCallback(() => {
    if (status !== 'playing' || isBotThinking) return;
    sound.playClick();
    const suggested = getHintMove(board, currentPlayer, mode, xPieceIndices, oPieceIndices);
    setHintIndex(suggested);
  }, [status, isBotThinking, board, currentPlayer, mode, xPieceIndices, oPieceIndices]);

  return {
    board,
    setBoard,
    currentPlayer,
    setCurrentPlayer,
    status,
    setStatus,
    winner,
    setWinner,
    winningLine,
    setWinningLine,
    roundNumber,
    moves,
    xPieceIndices,
    setXPieceIndices,
    oPieceIndices,
    setOPieceIndices,
    isBotThinking,
    hintIndex,
    blitzTimeLeft,
    streakMilestone,
    clearStreakMilestone: () => setStreakMilestone(null),
    score,
    setScore,
    makeMove,
    resetRound,
    resetScores,
    undoLastMove,
    requestHint,
  };
}
