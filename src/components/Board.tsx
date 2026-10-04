import React, { useState } from 'react';
import {
  CellValue,
  Player,
  WinningLine as WinningLineType,
  GameMode,
  ThemeConfig,
  BoardCustomization,
} from '../types/game';
import { MarkIcon } from './MarkIcon';
import { WinningLine } from './WinningLine';
import { Sparkles } from 'lucide-react';

interface BoardProps {
  board: CellValue[];
  mode: GameMode;
  theme: ThemeConfig;
  currentPlayer: Player;
  winningLine: WinningLineType | null;
  winner: Player | null;
  isGameOver: boolean;
  isBotThinking: boolean;
  hintIndex: number | null;
  xPieceIndices: number[]; // In chronological order for Infinite mode
  oPieceIndices: number[];
  customization?: BoardCustomization;
  onCellClick: (index: number) => void;
}

const DEFAULT_BOARD_CUSTOMIZATION: BoardCustomization = {
  style: 'glass-stadium',
  cellFinish: 'frosted-glass',
  markStyle: 'neon-glow',
  showCoordinates: true,
  showTurnGlow: true,
};

export const Board: React.FC<BoardProps> = ({
  board,
  mode,
  theme,
  currentPlayer,
  winningLine,
  winner,
  isGameOver,
  isBotThinking,
  hintIndex,
  xPieceIndices,
  oPieceIndices,
  customization = DEFAULT_BOARD_CUSTOMIZATION,
  onCellClick,
}) => {
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);

  const is12x12 = mode === 'grid12x12';
  const is6x6 = mode === 'grid6x6';
  const is4x4 = mode === 'grid4x4';
  const size = is12x12 ? 12 : is6x6 ? 6 : is4x4 ? 4 : 3;
  const gridColsClass = is12x12
    ? 'grid-cols-12'
    : is6x6
    ? 'grid-cols-6'
    : is4x4
    ? 'grid-cols-4'
    : 'grid-cols-3';

  // Determine if a cell is the oldest for X or O in infinite mode
  const getInfiniteInfo = (index: number) => {
    if (mode !== 'infinite3') return { isExpiring: false, order: undefined };

    const xOrder = xPieceIndices.indexOf(index);
    if (xOrder !== -1) {
      const isExpiring = currentPlayer === 'X' && xPieceIndices.length >= 3 && xOrder === 0;
      return { isExpiring, order: xOrder + 1 };
    }

    const oOrder = oPieceIndices.indexOf(index);
    if (oOrder !== -1) {
      const isExpiring = currentPlayer === 'O' && oPieceIndices.length >= 3 && oOrder === 0;
      return { isExpiring, order: oOrder + 1 };
    }

    return { isExpiring: false, order: undefined };
  };

  const activeColor = currentPlayer === 'X' ? theme.xColor : theme.oColor;
  const activeGlow = currentPlayer === 'X' ? theme.xGlow : theme.oGlow;

  // Compute container class based on BoardStyle
  const getBoardChassisClasses = () => {
    switch (customization.style) {
      case 'cyber-matrix':
        return 'rounded-xl bg-slate-950/95 border-2 border-cyan-500/40 shadow-[0_0_40px_rgba(6,182,212,0.25)]';
      case 'minimal-clean':
        return 'rounded-2xl bg-transparent border-0 shadow-none p-1';
      case 'tactile-wood':
        return 'rounded-3xl bg-amber-950/80 dark:bg-[#1a120b] border-4 border-amber-900/60 shadow-[0_20px_50px_rgba(0,0,0,0.6)]';
      case 'glass-stadium':
      default:
        return 'rounded-[28px] bg-white/85 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800/90 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] backdrop-blur-2xl';
    }
  };

  // Compute cell classes based on CellFinish & BoardStyle
  const getCellClasses = (canClick: boolean, isWinning: boolean, isHint: boolean) => {
    let base = is12x12
      ? 'relative rounded-[3px] sm:rounded-md flex items-center justify-center transition-all duration-150 focus:outline-none select-none overflow-hidden group border'
      : 'relative rounded-2xl flex items-center justify-center transition-all duration-200 focus:outline-none select-none overflow-hidden group border';

    if (!is12x12) {
      if (customization.style === 'cyber-matrix') {
        base += ' rounded-lg';
      } else if (customization.style === 'minimal-clean') {
        base += ' rounded-2xl';
      }
    }

    // Cell surface finishes
    switch (customization.cellFinish) {
      case 'deep-gloss':
        base += ' bg-gradient-to-b from-white/90 via-slate-100/90 to-slate-200/90 dark:from-slate-800/95 dark:via-slate-900/90 dark:to-slate-950 border-white/40 dark:border-slate-700/60 shadow-lg';
        break;
      case 'matte-stealth':
        base += ' bg-slate-200/70 dark:bg-slate-950/90 border-slate-300 dark:border-slate-800/80 shadow-none';
        break;
      case 'frosted-glass':
      default:
        base += ' bg-slate-50/90 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800/80 shadow-inner';
        break;
    }

    if (canClick) {
      base += is12x12
        ? ' cursor-pointer hover:scale-[1.08] active:scale-[0.95] hover:z-20 hover:shadow-md'
        : ' cursor-pointer hover:scale-[1.03] active:scale-[0.97] hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]';
    } else {
      base += ' cursor-default';
    }

    if (isWinning) {
      base += is12x12
        ? ' ring-1 sm:ring-2 ring-emerald-400 bg-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.8)] z-10'
        : ' ring-2 ring-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.4)] bg-emerald-50 dark:bg-emerald-950/30';
    } else if (isHint) {
      base += is12x12
        ? ' ring-1 sm:ring-2 ring-amber-400 bg-amber-500/30 animate-pulse z-10'
        : ' ring-2 ring-amber-500 shadow-[0_0_20px_rgba(251,191,36,0.4)] bg-amber-50 dark:bg-amber-950/30 animate-pulse';
    }

    return base;
  };

  return (
    <div
      className={`relative mx-auto w-full ${
        is12x12
          ? 'max-w-[min(96vw,560px)]'
          : is6x6
          ? 'max-w-[min(92vw,480px)]'
          : is4x4
          ? 'max-w-[min(92vw,440px)]'
          : 'max-w-[min(92vw,420px)]'
      } aspect-square transition-all duration-500`}
    >
      {/* Optional Board Coordinates (A-L / 1-12) */}
      {customization.showCoordinates && (
        <>
          {/* Top Column labels A..L */}
          <div
            className={`absolute -top-5 inset-x-2 sm:inset-x-4 grid ${gridColsClass} text-center ${
              is12x12 ? 'text-[8px]' : 'text-[10px]'
            } font-mono font-bold text-slate-400 dark:text-slate-500 pointer-events-none select-none tracking-tighter sm:tracking-widest`}
          >
            {Array.from({ length: size }).map((_, i) => (
              <span key={i}>{String.fromCharCode(65 + i)}</span>
            ))}
          </div>
          {/* Left Row labels 1..12 */}
          <div
            className={`absolute -left-5 inset-y-2 sm:inset-y-4 flex flex-col justify-around text-center ${
              is12x12 ? 'text-[8px]' : 'text-[10px]'
            } font-mono font-bold text-slate-400 dark:text-slate-500 pointer-events-none select-none`}
          >
            {Array.from({ length: size }).map((_, i) => (
              <span key={i}>{i + 1}</span>
            ))}
          </div>
        </>
      )}

      {/* Reactive ambient glow behind the arena */}
      {customization.showTurnGlow && (
        <div
          className="absolute -inset-2 rounded-[32px] opacity-20 dark:opacity-25 blur-2xl pointer-events-none transition-all duration-700"
          style={{
            backgroundColor: activeColor,
            filter: `drop-shadow(0 0 30px ${activeGlow})`,
          }}
        />
      )}

      {/* 12x12 Win Condition Indicator Banner */}
      {is12x12 && (
        <div className="mb-2.5 flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 shadow-sm">
            <span>🎯</span>
            <span><strong>Target:</strong> Connect 6 in a row to win!</span>
          </span>
        </div>
      )}

      {/* Board Chassis Container */}
      <div
        className={`relative w-full h-full ${is12x12 ? 'p-1.5 sm:p-2.5' : 'p-3 sm:p-4'} ${getBoardChassisClasses()}`}
        style={
          theme.isCustom && theme.gridBorder && theme.gridBorder.startsWith('#')
            ? {
                borderColor: theme.gridBorder,
                boxShadow: theme.vibe === 'neon' ? `0 0 30px ${theme.gridBorder}40` : undefined,
              }
            : undefined
        }
      >
        {/* Top metallic bevel reflection */}
        {customization.style === 'glass-stadium' && (
          <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-white/20 to-transparent pointer-events-none" />
        )}

        {/* Cyber Matrix Corner Brackets */}
        {customization.style === 'cyber-matrix' && (
          <>
            <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
            <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
            <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
            <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />
          </>
        )}

        {/* Grid container */}
        <div
          role="grid"
          aria-label="Tic-Tac-Toe Game Board"
          className={`relative z-10 w-full h-full grid ${gridColsClass} ${
            is12x12 ? 'gap-0.5 sm:gap-1' : is6x6 ? 'gap-1 sm:gap-2' : is4x4 ? 'gap-2 sm:gap-2.5' : 'gap-2.5 sm:gap-3'
          }`}
        >
          {board.map((cell, index) => {
            const isWinningCell = winningLine?.indices.includes(index);
            const isHint = hintIndex === index;
            const { isExpiring, order } = getInfiniteInfo(index);
            const canClick = !isGameOver && !isBotThinking && cell === null;

            return (
              <button
                key={index}
                role="gridcell"
                aria-label={`Row ${Math.floor(index / size) + 1} Column ${(index % size) + 1}, ${
                  cell ? `occupied by ${cell}` : 'empty'
                }`}
                disabled={!canClick}
                onClick={() => onCellClick(index)}
                onMouseEnter={() => setHoveredCell(index)}
                onMouseLeave={() => setHoveredCell(null)}
                className={getCellClasses(canClick, !!isWinningCell, isHint)}
                style={
                  theme.isCustom
                    ? {
                        borderColor: isWinningCell ? undefined : theme.gridBorder && theme.gridBorder.startsWith('#') ? `${theme.gridBorder}50` : undefined,
                        backgroundColor: isWinningCell ? undefined : theme.cellBg || undefined,
                        boxShadow: theme.vibe === 'neon' && theme.gridBorder && theme.gridBorder.startsWith('#') ? `0 0 10px ${theme.gridBorder}15` : undefined,
                      }
                    : undefined
                }
              >
                {/* Subtle top specular bevel */}
                <div className="absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                {/* Dynamic hover aura */}
                {canClick && (
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at center, ${activeColor}20 0%, transparent 75%)`,
                    }}
                  />
                )}

                {/* Placed Mark */}
                {cell ? (
                  <MarkIcon
                    player={cell}
                    theme={theme}
                    size={is12x12 ? 'xs' : is6x6 ? 'sm' : is4x4 ? 'md' : 'lg'}
                    isExpiring={isExpiring}
                    orderNumber={order}
                    markStyle={customization.markStyle}
                  />
                ) : (
                  /* Ghost hover preview mark */
                  canClick &&
                  hoveredCell === index && (
                    <div className="opacity-30 scale-95 group-hover:scale-100 transition-all duration-150">
                      <MarkIcon
                        player={currentPlayer}
                        theme={theme}
                        size={is12x12 ? 'xs' : is6x6 ? 'sm' : is4x4 ? 'md' : 'lg'}
                        animated={false}
                        markStyle={customization.markStyle}
                      />
                    </div>
                  )
                )}

                {/* Hint badge */}
                {isHint && (
                  is12x12 ? (
                    <div className="absolute inset-0 bg-amber-400/40 animate-pulse pointer-events-none" />
                  ) : (
                    <div className="absolute top-1.5 right-2 flex items-center gap-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-300 font-mono tracking-wider bg-amber-100 dark:bg-amber-950/90 px-1.5 py-0.5 rounded-full border border-amber-500/50 shadow-sm">
                      <Sparkles className="w-2.5 h-2.5 text-amber-500 dark:text-amber-400" />
                      <span>BEST</span>
                    </div>
                  )
                )}
              </button>
            );
          })}

          {/* Animated Winning Strike Line */}
          {winningLine && winner && (
            <WinningLine
              winningLine={winningLine}
              mode={mode}
              theme={theme}
              winner={winner}
            />
          )}
        </div>
      </div>
    </div>
  );
};
