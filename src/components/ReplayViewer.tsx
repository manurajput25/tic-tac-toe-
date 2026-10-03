import React, { useState, useEffect } from 'react';
import { MoveRecord, GameMode, ThemeConfig, CellValue } from '../types/game';
import { MarkIcon } from './MarkIcon';
import { ChevronLeft, ChevronRight, Play, Pause, X, RotateCcw } from 'lucide-react';

interface ReplayViewerProps {
  moves: MoveRecord[];
  mode: GameMode;
  theme: ThemeConfig;
  onClose: () => void;
}

export const ReplayViewer: React.FC<ReplayViewerProps> = ({
  moves,
  mode,
  theme,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(moves.length);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const totalCells = mode === 'grid4x4' ? 16 : 9;
  const gridColsClass = mode === 'grid4x4' ? 'grid-cols-4' : 'grid-cols-3';

  // Compute reconstructed board at currentStep
  const reconstructedBoard: CellValue[] = Array(totalCells).fill(null);
  for (let i = 0; i < currentStep; i++) {
    const move = moves[i];
    if (move.removedIndex !== undefined && move.removedIndex !== null) {
      reconstructedBoard[move.removedIndex] = null;
    }
    reconstructedBoard[move.index] = move.player;
  }

  // Auto-play through moves
  useEffect(() => {
    if (!isPlaying) return;

    if (currentStep >= moves.length) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
    }, 700);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, moves.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div>
            <h3 className="font-display text-lg font-bold text-white tracking-tight">
              Match Replay Analysis
            </h3>
            <p className="text-xs text-slate-400">
              Move {currentStep} of {moves.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Board View at currentStep */}
        <div className="relative mx-auto w-64 h-64 p-2.5 rounded-2xl bg-slate-950 border border-slate-800 mb-6">
          <div className={`w-full h-full grid ${gridColsClass} gap-1.5`}>
            {reconstructedBoard.map((cell, idx) => {
              const isLastPlaced =
                currentStep > 0 && moves[currentStep - 1]?.index === idx;

              return (
                <div
                  key={idx}
                  className={`rounded-xl flex items-center justify-center bg-slate-900/80 border ${
                    isLastPlaced
                      ? 'border-cyan-500/80 bg-slate-800/80 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                      : 'border-slate-800/60'
                  }`}
                >
                  {cell && (
                    <MarkIcon
                      player={cell}
                      theme={theme}
                      size="sm"
                      animated={false}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Progress Scrubber */}
        <div className="mb-4">
          <input
            type="range"
            min={0}
            max={moves.length}
            value={currentStep}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentStep(Number(e.target.value));
            }}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Controller buttons */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentStep(0);
            }}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Jump to start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentStep((prev) => Math.max(0, prev - 1));
              }}
              disabled={currentStep <= 0}
              className="p-2 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                if (currentStep >= moves.length) setCurrentStep(0);
                setIsPlaying(!isPlaying);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl flex items-center gap-1.5 text-xs font-semibold border border-slate-700 transition-colors"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentStep((prev) => Math.min(moves.length, prev + 1));
              }}
              disabled={currentStep >= moves.length}
              className="p-2 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
