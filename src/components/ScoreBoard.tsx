import React from 'react';
import { Player, GameScore, OpponentType, BotDifficulty, ThemeConfig } from '../types/game';
import { Bot, User, Flame, Clock } from 'lucide-react';

interface ScoreBoardProps {
  score: GameScore;
  currentPlayer: Player;
  opponent: OpponentType;
  botDifficulty: BotDifficulty;
  theme: ThemeConfig;
  blitzTimeLeft: number | null;
  blitzDuration: number | null;
  roundNumber: number;
  isBotThinking: boolean;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  score,
  currentPlayer,
  opponent,
  botDifficulty,
  theme,
  blitzTimeLeft,
  blitzDuration,
  roundNumber,
  isBotThinking,
}) => {
  const isXTurn = currentPlayer === 'X';
  const isOTurn = currentPlayer === 'O';

  // Format difficulty text
  const difficultyLabel =
    botDifficulty === 'unbeatable' ? 'Master AI' : botDifficulty === 'medium' ? 'Tactician' : 'Casual';

  return (
    <div className="w-full max-w-xl mx-auto mb-6">
      {/* Upper Meta line: Unboxed metadata with typographic separators */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3 px-1.5 tabular-nums">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Round {roundNumber}</span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
          <span>Draws: {score.draws}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 font-bold px-2.5 py-0.5 rounded-full border transition-all ${
              score.currentStreak >= 3
                ? 'bg-gradient-to-r from-amber-500/25 via-orange-500/30 to-rose-500/25 text-amber-600 dark:text-amber-300 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.45)] ring-1 ring-amber-400/80'
                : 'text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10 border-amber-500/20 shadow-sm'
            }`}
          >
            <Flame
              className={`w-3.5 h-3.5 ${
                score.currentStreak >= 3
                  ? 'text-orange-500 fill-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)] animate-pulse'
                  : 'text-amber-500 animate-pulse'
              }`}
            />
            <span>Streak {score.currentStreak} {score.currentStreak >= 3 ? '🔥' : ''}</span>
          </span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
          <span className="text-slate-400 dark:text-slate-500">Best {score.bestStreak}</span>
        </div>
      </div>

      {/* Main Player Versus Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 relative">
        {/* Player X Card */}
        <div
          className={`p-2.5 sm:p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden backdrop-blur-xl ${
            isXTurn
              ? 'bg-white/95 dark:bg-slate-900/90 border-cyan-500/60 shadow-[0_4px_20px_rgba(6,182,212,0.15)] dark:shadow-[0_0_30px_rgba(6,182,212,0.22)] scale-[1.02]'
              : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-75 hover:opacity-90'
          }`}
          style={isXTurn ? { borderColor: `${theme.xColor}90` } : {}}
        >
          {/* Top specular reflection */}
          <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-white/15 to-transparent pointer-events-none" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-black text-xl shadow-inner border"
                style={{
                  backgroundColor: `${theme.xColor}18`,
                  color: theme.xColor,
                  borderColor: `${theme.xColor}40`,
                  boxShadow: isXTurn ? `0 0 12px ${theme.xGlow}` : 'none',
                }}
              >
                ✕
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-wide">Player X</span>
                  <User className="w-3 h-3 text-slate-400" />
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {isXTurn ? (
                    <span className="text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping inline-block" />
                      Active Turn
                    </span>
                  ) : (
                    'Waiting'
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white tabular-nums tracking-tight">
                {score.playerX}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">Wins</div>
            </div>
          </div>

          {/* Bottom active edge bar */}
          {isXTurn && (
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5 shadow-sm"
              style={{ backgroundColor: theme.xColor }}
            />
          )}
        </div>

        {/* Player O Card */}
        <div
          className={`p-2.5 sm:p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden backdrop-blur-xl ${
            isOTurn
              ? 'bg-white/95 dark:bg-slate-900/90 border-rose-500/60 shadow-[0_4px_20px_rgba(244,63,94,0.15)] dark:shadow-[0_0_30px_rgba(244,63,94,0.22)] scale-[1.02]'
              : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-75 hover:opacity-90'
          }`}
          style={isOTurn ? { borderColor: `${theme.oColor}90` } : {}}
        >
          {/* Top specular reflection */}
          <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-white/15 to-transparent pointer-events-none" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-black text-xl shadow-inner border"
                style={{
                  backgroundColor: `${theme.oColor}18`,
                  color: theme.oColor,
                  borderColor: `${theme.oColor}40`,
                  boxShadow: isOTurn ? `0 0 12px ${theme.oGlow}` : 'none',
                }}
              >
                ◯
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-wide">
                    {opponent === 'bot' ? 'Gemini' : 'Player O'}
                  </span>
                  {opponent === 'bot' ? (
                    <Bot className="w-3 h-3 text-cyan-500 dark:text-cyan-400" />
                  ) : (
                    <User className="w-3 h-3 text-slate-400" />
                  )}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {isOTurn ? (
                    isBotThinking ? (
                      <span className="text-rose-600 dark:text-rose-400 font-semibold animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
                        Gemini is calculating...
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
                        Active Turn
                      </span>
                    )
                  ) : opponent === 'bot' ? (
                    `Gemini · ${difficultyLabel}`
                  ) : (
                    'Waiting'
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white tabular-nums tracking-tight">
                {score.playerO}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">Wins</div>
            </div>
          </div>

          {/* Bottom active edge bar */}
          {isOTurn && (
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5 shadow-sm"
              style={{ backgroundColor: theme.oColor }}
            />
          )}
        </div>
      </div>

      {/* Blitz Timer Bar (when blitz timer is active) */}
      {blitzDuration !== null && blitzTimeLeft !== null && (
        <div className="mt-3 bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/90 flex items-center gap-3 backdrop-blur-md shadow-sm">
          <Clock className={`w-3.5 h-3.5 ${blitzTimeLeft <= 3 ? 'text-rose-500 animate-bounce' : 'text-slate-400'}`} />
          <div className="flex-1 bg-slate-200 dark:bg-slate-800/90 rounded-full h-2 overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                blitzTimeLeft <= 3
                  ? 'bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_0_10px_rgba(244,63,94,0.6)]'
                  : isXTurn
                  ? 'bg-gradient-to-r from-cyan-500 to-sky-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                  : 'bg-gradient-to-r from-rose-500 to-pink-400 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
              }`}
              style={{ width: `${(blitzTimeLeft / blitzDuration) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold tabular-nums text-slate-700 dark:text-slate-200 min-w-[28px] text-right">
            {blitzTimeLeft}s
          </span>
        </div>
      )}
    </div>
  );
};
