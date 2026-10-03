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
  const is4x4 = mode === 'grid4x4';
  const color = winner === 'X' ? theme.xColor : theme.oColor;
  const glow = winner === 'X' ? theme.xGlow : theme.oGlow;

  let x1 = 0, y1 = 0, x2 = 0, y2 = 0;

  if (!is4x4) {
    // 3x3 Grid (positions in percentages 0..100)
    const rowY = [16.66, 50, 83.33];
    const colX = [16.66, 50, 83.33];

    if (winningLine.direction === 'horizontal') {
      const r = winningLine.rowOrCol ?? Math.floor(winningLine.indices[0] / 3);
      y1 = y2 = rowY[r];
      x1 = 6;
      x2 = 94;
    } else if (winningLine.direction === 'vertical') {
      const c = winningLine.rowOrCol ?? (winningLine.indices[0] % 3);
      x1 = x2 = colX[c];
      y1 = 6;
      y2 = 94;
    } else if (winningLine.direction === 'diagonal-main') {
      x1 = 8;
      y1 = 8;
      x2 = 92;
      y2 = 92;
    } else {
      x1 = 92;
      y1 = 8;
      x2 = 8;
      y2 = 92;
    }
  } else {
    // 4x4 Grid
    const rowY = [12.5, 37.5, 62.5, 87.5];
    const colX = [12.5, 37.5, 62.5, 87.5];

    if (winningLine.direction === 'horizontal') {
      const r = winningLine.rowOrCol ?? Math.floor(winningLine.indices[0] / 4);
      y1 = y2 = rowY[r];
      x1 = 5;
      x2 = 95;
    } else if (winningLine.direction === 'vertical') {
      const c = winningLine.rowOrCol ?? (winningLine.indices[0] % 4);
      x1 = x2 = colX[c];
      y1 = 5;
      y2 = 95;
    } else if (winningLine.direction === 'diagonal-main') {
      x1 = 6;
      y1 = 6;
      x2 = 94;
      y2 = 94;
    } else {
      x1 = 94;
      y1 = 6;
      x2 = 6;
      y2 = 94;
    }
  }

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
        strokeWidth="6"
        strokeLinecap="round"
        className="animate-draw"
      />

      {/* Foreground sharp strike stroke */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        filter="url(#glow-strike)"
        className="animate-draw"
      />
    </svg>
  );
};
