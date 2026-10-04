import React from 'react';
import { Player, GameStatus, OpponentType, ThemeConfig } from '../types/game';
import { RotateCcw, Eye, Equal } from 'lucide-react';
import { MarkIcon } from './MarkIcon';

interface GameOverModalProps {
  status: GameStatus;
  winner: Player | null;
  opponent: OpponentType;
  theme: ThemeConfig;
  streakCount?: number;
  playerXName?: string;
  playerOName?: string;
  onPlayAgain: () => void;
  onReviewMatch: () => void;
  onClose: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  status,
  winner,
  opponent,
  theme,
  streakCount,
  playerXName,
  playerOName,
  onPlayAgain,
  onReviewMatch,
  onClose,
}) => {
  if (status === 'playing') return null;

  const isWin = status === 'won';
  const isAiWinner = isWin && opponent === 'bot' && winner === 'O';
  const winnerTitle =
    isWin
      ? opponent === 'bot'
        ? isAiWinner
          ? 'Gemini Claims Victory'
          : 'You Won!'
        : opponent === 'online'
        ? winner === 'X'
          ? `${playerXName || 'Host'} Triumphs!`
          : `${playerOName || 'Challenger'} Triumphs!`
        : `Player ${winner} Triumphs!`
      : "It's a Stalemate!";

  const accentColor =
    isWin && winner === 'X'
      ? theme.xColor
      : isWin && winner === 'O'
      ? theme.oColor
      : '#94a3b8';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm p-6 sm:p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-[32px] shadow-2xl text-center overflow-hidden">
        {/* Top highlight */}
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-white/25 to-transparent pointer-events-none" />

        {/* Ambient background bloom */}
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full blur-3xl opacity-20 dark:opacity-35 pointer-events-none"
          style={{ backgroundColor: accentColor }}
        />

        {/* Winner Mark Presentation */}
        <div className="relative z-10">
          <div
            className="mx-auto w-20 h-20 mb-4 rounded-3xl flex items-center justify-center bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-lg relative"
            style={{
              boxShadow: isWin ? `0 0 30px ${accentColor}40` : undefined,
            }}
          >
            {isWin && winner ? (
              <MarkIcon player={winner} theme={theme} size="lg" animated={false} />
            ) : (
              <Equal className="w-9 h-9 text-slate-400" />
            )}
          </div>

          {streakCount && streakCount >= 3 && isWin && winner === 'X' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/30 to-rose-500/20 border border-amber-500/50 shadow-md text-amber-500 dark:text-amber-300 text-xs font-black tracking-wider uppercase mb-2 animate-pulse">
              <span>🔥 {streakCount}-WIN STREAK ACTIVE 🔥</span>
            </div>
          )}

          <h3 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white mb-1.5 tracking-tight">
            {winnerTitle}
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            {isWin
              ? opponent === 'bot'
                ? isAiWinner
                  ? 'Gemini uncovered the decisive sequence. Ready for a rematch?'
                  : 'Magnificent tactical mastery! You defeated Gemini.'
                : `Player ${winner} dominated the arena and aligned the win.`
              : 'Every corridor contested. Perfect defensive equilibrium.'}
          </p>

          {/* Action buttons */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={onPlayAgain}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-sm rounded-2xl hover:brightness-105 active:scale-[0.98] transition-all shadow-xl whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Next Round</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onReviewMatch}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Review Moves</span>
              </button>
              <button
                onClick={onClose}
                className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-medium text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors whitespace-nowrap cursor-pointer"
              >
                Board
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
