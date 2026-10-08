import React from 'react';
import { OpponentType, BotDifficulty, GameMode } from '../types/game';
import { Lightbulb, Bot, Users, Globe, User } from 'lucide-react';

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
  onOpenOnlineLobby?: () => void;
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
  onOpenOnlineLobby,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto mt-3 sm:mt-6 flex flex-col gap-2 sm:gap-3">
      {/* Upper controls: Opponent switch & Bot difficulty (if bot mode) */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2.5 p-1.5 sm:p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800/90 backdrop-blur-xl shadow-sm dark:shadow-lg">
        {/* Opponent Segmented control */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 dark:bg-slate-950/80 p-0.5 sm:p-1 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800/90">
          <button
            onClick={() => onChangeOpponent('bot')}
            title="Human vs Robot"
            aria-label="Human vs Robot"
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold rounded-md sm:rounded-lg transition-all cursor-pointer ${
              opponent === 'bot'
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-slate-700/80 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-1">
              <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 dark:text-amber-400" />
              <span className="text-[9px] sm:text-[10px] font-bold opacity-60">vs</span>
              <Bot className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-500 dark:text-cyan-400" />
            </div>
          </button>
          <button
            onClick={() => onChangeOpponent('pvp')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold rounded-md sm:rounded-lg transition-all cursor-pointer ${
              opponent === 'pvp'
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-slate-700/80 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden xs:inline">2 Players</span>
            <span className="xs:hidden">2P</span>
          </button>
          <button
            onClick={() => {
              onChangeOpponent('online');
              if (onOpenOnlineLobby) onOpenOnlineLobby();
            }}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold rounded-md sm:rounded-lg transition-all cursor-pointer ${
              opponent === 'online'
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-slate-700/80 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-500" />
            <span>Online</span>
          </button>
        </div>

        {/* Bot Difficulty selector (only visible when vs Bot) */}
        {opponent === 'bot' && (
          <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 dark:bg-slate-950/80 p-0.5 sm:p-1 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800/90">
            <button
              onClick={() => onChangeDifficulty('easy')}
              className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-md sm:rounded-lg transition-colors ${
                botDifficulty === 'easy'
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Casual
            </button>
            <button
              onClick={() => onChangeDifficulty('medium')}
              className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-md sm:rounded-lg transition-colors ${
                botDifficulty === 'medium'
                  ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700/60 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Tactician
            </button>
            <button
              onClick={() => onChangeDifficulty('unbeatable')}
              className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-md sm:rounded-lg transition-colors ${
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
          className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg sm:rounded-xl border transition-all ${
            canHint && !isGameOver
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/20 active:scale-95 shadow-sm cursor-pointer'
              : 'bg-slate-100 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-900 cursor-not-allowed'
          }`}
          title="Highlight optimal tactical move"
        >
          <Lightbulb className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 dark:text-amber-400" />
          <span>Hint</span>
        </button>
      </div>

      {/* Mode Brief Info card */}
      <div className="text-center text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white/60 dark:bg-slate-900/40 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm">
        {gameMode === 'classic3x3' && (
          <span>Classic rules: Connect 3 marks horizontally, vertically, or diagonally to win.</span>
        )}
        {gameMode === 'infinite3' && (
          <span>
            <strong className="text-amber-600 dark:text-amber-300 font-semibold">Infinite 3-Piece Mode:</strong> Each player holds only 3 marks maximum. Placing your 4th mark evaporates your oldest piece!
          </span>
        )}
        {gameMode === 'grid6x6' && (
          <span>6×6 Grand Arena: Align 4 consecutive marks across 36 cells. Master open ends and forks!</span>
        )}
      </div>
    </div>
  );
};
