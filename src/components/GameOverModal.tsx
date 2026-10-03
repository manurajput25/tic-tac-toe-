import React from 'react';
import { Player, GameStatus, OpponentType, ThemeConfig } from '../types/game';
import { RotateCcw, Eye, Trophy, Sparkles, Equal } from 'lucide-react';
import { MarkIcon } from './MarkIcon';

interface GameOverModalProps {
  status: GameStatus;
  winner: Player | null;
  opponent: OpponentType;
  theme: ThemeConfig;
  onPlayAgain: () => void;
  onReviewMatch: () => void;
  onClose: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  status,
  winner,
  opponent,
  theme,
  onPlayAgain,
  onReviewMatch,
  onClose,
}) => {
  if (status === 'playing') return null;

  const isWin = status === 'won';
  const isHumanWinner =
    isWin && (winner === 'X' || (opponent === 'pvp' && winner === 'O'));
  const isAiWinner = isWin && opponent === 'bot' && winner === 'O';

  const accentColor =
    isWin && winner === 'X'
      ? theme.xColor
      : isWin && winner === 'O'
      ? theme.oColor
      : '#94a3b8';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm p-6 sm:p-7 bg-slate-900/95 border border-slate-700/80 rounded-[32px] shadow-[0_25px_70px_rgba(0,0,0,0.8)] text-center overflow-hidden">
        {/* Top bevel highlight */}
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

        {/* Ambient background bloom */}
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full blur-3xl opacity-35 pointer-events-none"
          style={{ backgroundColor: accentColor }}
        />

        {/* Winner Mark Presentation */}
        <div className="relative z-10">
          <div
            className="mx-auto w-20 h-20 mb-4 rounded-3xl flex items-center justify-center bg-slate-800/90 border border-slate-700/80 shadow-2xl relative"
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

          <h3 className="font-display text-2xl font-extrabold text-white mb-1.5 tracking-tight">
            {isWin
              ? opponent === 'bot'
                ? isAiWinner
                  ? 'AI Claims Victory'
                  : 'Victory Achieved!'
                : `Player ${winner} Triumphs!`
              : "It's a Stalemate!"}
          </h3>

          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            {isWin
              ? opponent === 'bot'
                ? isAiWinner
                  ? 'The bot uncovered the decisive sequence. Ready for a rematch?'
                  : 'Magnificent tactical mastery! Your win streak surges.'
                : `Player ${winner} dominated the arena and aligned the win.`
              : 'Every corridor contested. Perfect defensive equilibrium.'}
          </p>

          {/* Action buttons */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={onPlayAgain}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-white via-slate-100 to-slate-200 text-slate-950 font-bold text-sm rounded-2xl hover:brightness-105 active:scale-[0.98] transition-all shadow-xl whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Next Round</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onReviewMatch}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-800/90 text-slate-300 font-semibold text-xs rounded-xl hover:bg-slate-700 hover:text-white border border-slate-700/70 transition-colors whitespace-nowrap"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Review Moves</span>
              </button>
              <button
                onClick={onClose}
                className="py-2.5 px-4 bg-slate-800/40 text-slate-400 font-medium text-xs rounded-xl hover:bg-slate-800 hover:text-slate-200 border border-slate-800 transition-colors whitespace-nowrap"
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
