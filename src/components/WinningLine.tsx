import React from 'react';
import { WinningLine as WinningLineType, GameMode, ThemeConfig, Player } from '../types/game';

interface WinningLineProps {
  winningLine: WinningLineType;
  mode: GameMode;
  theme: ThemeConfig;
  winner: Player;
}

export const WinningLine: React.FC<WinningLineProps> = ({
  winningLine,
  mode,
  theme,
  winner,
}) => {
  const color = winner === 'X' ? theme.xColor : theme.oColor;
  const glow = winner === 'X' ? theme.xGlow : theme.oGlow;

  const size = mode === 'grid6x6' ? 6 : 3;
  const first = winningLine.indices[0];
  const last = winningLine.indices[winningLine.indices.length - 1];

  const getCellCenter = (idx: number) => {
    const col = idx % size;
    const row = Math.floor(idx / size);
    return {
      x: ((col + 0.5) / size) * 100,
      y: ((row + 0.5) / size) * 100,
    };
  };

  const start = getCellCenter(first);
  const end = getCellCenter(last);

  // Extend line slightly past endpoints for dramatic laser finish
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.hypot(dx, dy) || 1;
  const extension = size === 6 ? 2.5 : 5.5;

  const x1 = start.x - (dx / dist) * extension;
  const y1 = start.y - (dy / dist) * extension;
  const x2 = end.x + (dx / dist) * extension;
  const y2 = end.y + (dy / dist) * extension;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <filter id="glow-strike" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background glow stroke */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={glow}
        strokeWidth={size === 6 ? 6 : 8}
        strokeLinecap="round"
        filter="url(#glow-strike)"
        className="opacity-70 animate-strike-glow"
      />

      {/* Primary colored core */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={size === 6 ? 3.5 : 4.5}
        strokeLinecap="round"
        className="animate-strike-core"
      />

      {/* White laser core reflection */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#ffffff"
        strokeWidth={size === 6 ? 1.5 : 2}
        strokeLinecap="round"
        className="opacity-95"
      />
    </svg>
  );
};
