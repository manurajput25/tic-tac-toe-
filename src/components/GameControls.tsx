import React from 'react';
import { OpponentType, BotDifficulty, GameMode } from '../types/game';
import { Lightbulb, Bot, Users } from 'lucide-react';

interface GameControlsProps {
  opponent: OpponentType;
  onChangeOpponent: (type: OpponentType) => void;
  botDifficulty: BotDifficulty;
  onChangeDifficulty: (difficulty: BotDifficulty) => void;
  onGetHint: () => void;
  onResetRound: () => void;
  isGameOver: boolean;
  canHint: boolean;
  gameMode: GameMode;
}

export const GameControls: React.FC<GameControlsProps> = ({
  opponent,
  onChangeOpponent,
  botDifficulty,
  onChangeDifficulty,
  onGetHint,
  isGameOver,
  canHint,
  gameMode,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto mt-6 flex flex-col gap-3">
      {/* Upper controls: Opponent switch & Bot difficulty (if bot mode) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800/90 backdrop-blur-xl shadow-sm dark:shadow-lg">
        {/* Opponent Segmented control */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800/90">
          <button
            onClick={() => onChangeOpponent('bot')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              opponent === 'bot'
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-slate-700/80'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>vs Gemini</span>
          </button>
          <button
            onClick={() => onChangeOpponent('pvp')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              opponent === 'pvp'
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-slate-700/80'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2 Players</span>
          </button>
        </div>

        {/* Bot Difficulty selector (only visible when vs Bot) */}
        {opponent === 'bot' && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800/90">
            <button
              onClick={() => onChangeDifficulty('easy')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                botDifficulty === 'easy'
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Casual
            </button>
            <button
              onClick={() => onChangeDifficulty('medium')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                botDifficulty === 'medium'
                  ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700/60 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Tactician
            </button>
            <button
              onClick={() => onChangeDifficulty('unbeatable')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                botDifficulty === 'unbeatable'
                  ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700/60 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Master AI
            </button>
          </div>
        )}

        {/* Coach Hint Button */}
        <button
          onClick={onGetHint}
          disabled={!canHint || isGameOver}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
            canHint && !isGameOver
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/20 active:scale-95 shadow-sm'
              : 'bg-slate-100 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-900 cursor-not-allowed'
          }`}
          title="Highlight optimal tactical move"
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span>Coach Hint</span>
        </button>
      </div>

      {/* Mode Brief Info card */}
      <div className="text-center text-xs text-slate-600 dark:text-slate-400 px-3 py-1.5 bg-white/60 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm">
        {gameMode === 'classic3x3' && (
          <span>Classic rules: Connect 3 marks horizontally, vertically, or diagonally to win.</span>
        )}
        {gameMode === 'infinite3' && (
          <span>
            <strong className="text-amber-600 dark:text-amber-300 font-semibold">Infinite 3-Piece Mode:</strong> Each player holds only 3 marks maximum. Placing your 4th mark evaporates your oldest piece!
          </span>
        )}
        {gameMode === 'grid4x4' && (
          <span>4×4 Tactical Arena: Line up 4 in a row to win. Dominate the central quads!</span>
        )}
        {gameMode === 'grid6x6' && (
          <span>6×6 Grand Arena: Align 4 consecutive marks across 36 cells. Master open ends and forks!</span>
        )}
      </div>
    </div>
  );
};
