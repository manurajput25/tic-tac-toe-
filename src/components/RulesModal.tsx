import React from 'react';
import { X, BookOpen, Command } from 'lucide-react';

interface RulesModalProps {
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Game Modes & Guide
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
          {/* Classic 3x3 */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />
              Classic 3×3
            </h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              The timeless duel. Take turns placing marks. The first player to align 3 consecutive marks in a horizontal, vertical, or diagonal row achieves victory. If all 9 cells fill with no alignment, the match concludes in a draw.
            </p>
          </div>

          {/* Infinite 3-Piece */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              Infinite 3-Piece Tactical Mode
            </h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
              Say goodbye to perpetual draws! Each participant is permitted a maximum of <strong>three marks</strong> simultaneously on the grid.
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
              <li>Upon placing your 4th mark, your earliest (oldest) mark dissolves into thin air.</li>
              <li>A pulsing animation alerts you to which piece will disappear on your next turn.</li>
              <li>Forces dynamic maneuvering, predictive traps, and constant board shifts!</li>
            </ul>
          </div>

          {/* Grid 4x4 */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
              Grid 4×4 Tactical
            </h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Expanded strategic arena with 16 cells. Align <strong>4 in a row</strong> horizontally, vertical, or diagonally. Controlling the central 2×2 quad is key to dominating diagonal corridors.
            </p>
          </div>

          {/* Grid 6x6 */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              Grid 6×6 Grand Arena
            </h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Massive 36-cell tactical battlefield. Connect <strong>4 in a row</strong> in any direction across the expanded grid to claim victory!
            </p>
          </div>

          {/* Grid 12x12 */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              12×12 Epic Colosseum (Connect 6)
            </h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Colossal 144-cell Gomoku-scale battlefield! Take turns placing marks. The first player to align <strong>6 consecutive marks (6-pair chain)</strong> in any direction (horizontal, vertical, or diagonal) achieves ultimate victory!
            </p>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-2 flex items-center gap-2">
              <Command className="w-4 h-4 text-slate-500" />
              Keyboard Shortcuts
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span>Place Move</span>
                <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300 font-mono text-[10px]">1 – 9 / Numpad</kbd>
              </div>
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span>Reset Round</span>
                <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300 font-mono text-[10px]">R</kbd>
              </div>
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span>Coach Hint</span>
                <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300 font-mono text-[10px]">H</kbd>
              </div>
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span>Toggle Sound</span>
                <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300 font-mono text-[10px]">M</kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold text-xs rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
