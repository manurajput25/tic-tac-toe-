import React, { useState } from 'react';
import { GameScore, GameMode } from '../types/game';
import { X, Trophy, Flame, RotateCcw, BarChart2 } from 'lucide-react';

interface StatsModalProps {
  score: GameScore;
  currentMode: GameMode;
  onResetStats: () => void;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  score,
  onResetStats,
  onClose,
}) => {
  const [confirmReset, setConfirmReset] = useState<boolean>(false);
  const [justReset, setJustReset] = useState<boolean>(false);

  const totalGames = score.playerX + score.playerO + score.draws;
  const xWinRate = totalGames > 0 ? Math.round((score.playerX / totalGames) * 100) : 0;
  const oWinRate = totalGames > 0 ? Math.round((score.playerO / totalGames) * 100) : 0;
  const drawRate = totalGames > 0 ? Math.round((score.draws / totalGames) * 100) : 0;

  const handleReset = () => {
    if (confirmReset) {
      onResetStats();
      setConfirmReset(false);
      setJustReset(true);
      setTimeout(() => setJustReset(false), 2500);
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Performance Statistics
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Highlight Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">
              <Flame className="w-3.5 h-3.5" />
              <span>Current Streak</span>
            </div>
            <div className="text-3xl font-display font-bold text-slate-900 dark:text-white tabular-nums">
              {score.currentStreak}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Consecutive wins</div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-cyan-600 dark:text-cyan-400 font-medium mb-1">
              <Trophy className="w-3.5 h-3.5" />
              <span>Best Streak</span>
            </div>
            <div className="text-3xl font-display font-bold text-slate-900 dark:text-white tabular-nums">
              {score.bestStreak}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Personal record</div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs">
            <span className="text-slate-600 dark:text-slate-400">Total Matches Completed</span>
            <span className="font-semibold text-slate-900 dark:text-white tabular-nums text-sm">{totalGames}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs">
            <span className="text-slate-600 dark:text-slate-400">Player X Victories</span>
            <span className="font-semibold text-cyan-600 dark:text-cyan-400 tabular-nums text-sm">
              {score.playerX} ({xWinRate}%)
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs">
            <span className="text-slate-600 dark:text-slate-400">Player O / Gemini Victories</span>
            <span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums text-sm">
              {score.playerO} ({oWinRate}%)
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs">
            <span className="text-slate-600 dark:text-slate-400">Stalemates / Draws</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums text-sm">
              {score.draws} ({drawRate}%)
            </span>
          </div>
        </div>

        {/* Win Rate Visual Bar */}
        {totalGames > 0 && (
          <div className="mb-6">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5 flex justify-between">
              <span>Victory Distribution</span>
              <span>X: {xWinRate}% · Gemini: {oWinRate}% · Draws: {drawRate}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-800">
              <div className="bg-cyan-500 h-full transition-all" style={{ width: `${xWinRate}%` }} />
              <div className="bg-rose-500 h-full transition-all" style={{ width: `${oWinRate}%` }} />
              <div className="bg-slate-400 dark:bg-slate-600 h-full transition-all" style={{ width: `${drawRate}%` }} />
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={handleReset}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer ${
              justReset
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                : confirmReset
                ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/60 animate-pulse'
                : 'text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-500/10'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>
              {justReset
                ? 'Stats Cleared! ✓'
                : confirmReset
                ? 'Click Again to Confirm Reset'
                : 'Reset Stats'}
            </span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold text-xs rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
