import React from 'react';
import { GameScore, GameMode } from '../types/game';
import { X, Trophy, Flame, RotateCcw, BarChart2, Shield } from 'lucide-react';

interface StatsModalProps {
  score: GameScore;
  currentMode: GameMode;
  onResetStats: () => void;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  score,
  currentMode,
  onResetStats,
  onClose,
}) => {
  const totalGames = score.playerX + score.playerO + score.draws;
  const xWinRate = totalGames > 0 ? Math.round((score.playerX / totalGames) * 100) : 0;
  const oWinRate = totalGames > 0 ? Math.round((score.playerO / totalGames) * 100) : 0;
  const drawRate = totalGames > 0 ? Math.round((score.draws / totalGames) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-cyan-400" />
            <h3 className="font-display text-lg font-bold text-white tracking-tight">
              Performance Statistics
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Highlight Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400 font-medium mb-1">
              <Flame className="w-3.5 h-3.5" />
              <span>Current Streak</span>
            </div>
            <div className="text-3xl font-display font-bold text-white tabular-nums">
              {score.currentStreak}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Consecutive wins</div>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-cyan-400 font-medium mb-1">
              <Trophy className="w-3.5 h-3.5" />
              <span>Best Streak</span>
            </div>
            <div className="text-3xl font-display font-bold text-white tabular-nums">
              {score.bestStreak}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Personal record</div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 text-xs">
            <span className="text-slate-400">Total Matches Completed</span>
            <span className="font-semibold text-white tabular-nums text-sm">{totalGames}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 text-xs">
            <span className="text-slate-400">Player X Victories</span>
            <span className="font-semibold text-cyan-400 tabular-nums text-sm">
              {score.playerX} ({xWinRate}%)
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 text-xs">
            <span className="text-slate-400">Player O / AI Victories</span>
            <span className="font-semibold text-rose-400 tabular-nums text-sm">
              {score.playerO} ({oWinRate}%)
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 text-xs">
            <span className="text-slate-400">Stalemates / Draws</span>
            <span className="font-semibold text-slate-300 tabular-nums text-sm">
              {score.draws} ({drawRate}%)
            </span>
          </div>
        </div>

        {/* Win Rate Visual Bar */}
        {totalGames > 0 && (
          <div className="mb-6">
            <div className="text-[11px] text-slate-400 mb-1.5 flex justify-between">
              <span>Victory Distribution</span>
              <span>X: {xWinRate}% · O: {oWinRate}% · Draws: {drawRate}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden flex bg-slate-800">
              <div className="bg-cyan-500 h-full transition-all" style={{ width: `${xWinRate}%` }} />
              <div className="bg-rose-500 h-full transition-all" style={{ width: `${oWinRate}%` }} />
              <div className="bg-slate-600 h-full transition-all" style={{ width: `${drawRate}%` }} />
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm('Reset all match stats and streaks to zero?')) {
                onResetStats();
              }
            }}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 p-1.5 rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Stats</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-white text-slate-950 font-semibold text-xs rounded-xl hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
