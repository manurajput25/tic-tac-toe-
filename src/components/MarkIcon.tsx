import React from 'react';
import { Player, ThemeConfig, MarkStyle } from '../types/game';

interface MarkIconProps {
  player: Player;
  theme: ThemeConfig;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  animated?: boolean;
  isExpiring?: boolean; // For Infinite mode: piece about to disappear
  orderNumber?: number; // 1 (oldest), 2, 3 (newest)
  markStyle?: MarkStyle;
}

export const MarkIcon: React.FC<MarkIconProps> = ({
  player,
  theme,
  size = 'lg',
  animated = true,
  isExpiring = false,
  orderNumber,
  markStyle = 'neon-glow',
}) => {
  const pixelSize = size === 'lg' ? 76 : size === 'md' ? 48 : size === 'sm' ? 28 : 18;
  const baseStrokeWidth = size === 'lg' ? 9.5 : size === 'md' ? 6.5 : size === 'sm' ? 4 : 2.8;
  const strokeWidth =
    markStyle === 'bold-solid'
      ? baseStrokeWidth * 1.35
      : markStyle === 'technical-hollow'
      ? baseStrokeWidth * 0.55
      : baseStrokeWidth;

  const color = player === 'X' ? theme.xColor : theme.oColor;
  const glow = player === 'X' ? theme.xGlow : theme.oGlow;
  const gradId = `mark-grad-${player}-${theme.id}-${size}-${markStyle}`;

  return (
    <div
      className={`relative flex items-center justify-center select-none transition-all duration-300 ${
        isExpiring ? 'opacity-40 animate-fade-warning scale-90' : 'opacity-100 scale-100'
      }`}
      style={{
        width: pixelSize,
        height: pixelSize,
        filter: isExpiring
          ? 'drop-shadow(0 0 6px rgba(244, 63, 94, 0.4))'
          : theme.vibe === 'minimalist'
          ? 'none'
          : markStyle === 'neon-glow'
          ? `drop-shadow(0 0 16px ${glow}) drop-shadow(0 0 3px ${color})`
          : markStyle === 'bold-solid'
          ? `drop-shadow(0 4px 12px rgba(0,0,0,0.5)) drop-shadow(0 0 8px ${glow})`
          : `drop-shadow(0 0 10px ${glow})`,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            {player === 'X' ? (
              <>
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="35%" stopColor={color} />
                <stop offset="100%" stopColor={color} stopOpacity="0.85" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="45%" stopColor={color} />
                <stop offset="100%" stopColor={color} stopOpacity="0.85" />
              </>
            )}
          </linearGradient>
        </defs>

        {player === 'X' ? (
          markStyle === 'technical-hollow' ? (
            /* Technical Blueprint Dual-Line X */
            <>
              {/* Outer parallel track */}
              <line
                x1="24"
                y1="20"
                x2="80"
                y2="76"
                pathLength={100}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="square"
                className={animated ? 'animate-draw' : undefined}
              />
              <line
                x1="20"
                y1="24"
                x2="76"
                y2="80"
                pathLength={100}
                stroke={`url(#${gradId})`}
                strokeWidth={strokeWidth}
                strokeLinecap="square"
                className={animated ? 'animate-draw' : undefined}
              />
              {/* Cross parallel track */}
              <line
                x1="76"
                y1="20"
                x2="20"
                y2="76"
                pathLength={100}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="square"
                className={animated ? 'animate-draw-delayed' : undefined}
              />
              <line
                x1="80"
                y1="24"
                x2="24"
                y2="80"
                pathLength={100}
                stroke={`url(#${gradId})`}
                strokeWidth={strokeWidth}
                strokeLinecap="square"
                className={animated ? 'animate-draw-delayed' : undefined}
              />
              {/* Corner crosshairs */}
              <circle cx="22" cy="22" r="1.5" fill={color} />
              <circle cx="78" cy="78" r="1.5" fill={color} />
              <circle cx="78" cy="22" r="1.5" fill={color} />
              <circle cx="22" cy="78" r="1.5" fill={color} />
            </>
          ) : (
            /* Neon-Glow / Bold-Solid X */
            <>
              {/* Ambient diffuse back stroke */}
              <line
                x1="22"
                y1="22"
                x2="78"
                y2="78"
                stroke={color}
                strokeWidth={strokeWidth * 1.5}
                strokeOpacity={markStyle === 'bold-solid' ? '0.4' : '0.25'}
                strokeLinecap={markStyle === 'bold-solid' ? 'square' : 'round'}
              />
              <line
                x1="78"
                y1="22"
                x2="22"
                y2="78"
                stroke={color}
                strokeWidth={strokeWidth * 1.5}
                strokeOpacity={markStyle === 'bold-solid' ? '0.4' : '0.25'}
                strokeLinecap={markStyle === 'bold-solid' ? 'square' : 'round'}
              />

              {/* Sharp gradient stroke 1 */}
              <line
                x1="22"
                y1="22"
                x2="78"
                y2="78"
                pathLength={100}
                stroke={`url(#${gradId})`}
                strokeWidth={strokeWidth}
                strokeLinecap={markStyle === 'bold-solid' ? 'square' : 'round'}
                className={animated ? 'animate-draw' : undefined}
              />

              {/* Sharp gradient stroke 2 */}
              <line
                x1="78"
                y1="22"
                x2="22"
                y2="78"
                pathLength={100}
                stroke={`url(#${gradId})`}
                strokeWidth={strokeWidth}
                strokeLinecap={markStyle === 'bold-solid' ? 'square' : 'round'}
                className={animated ? 'animate-draw-delayed' : undefined}
              />
            </>
          )
        ) : (
          markStyle === 'technical-hollow' ? (
            /* Technical Blueprint Dual-Circle O */
            <>
              {/* Outer ring */}
              <circle
                cx="50"
                cy="50"
                r="33"
                pathLength={100}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray="4 2"
                className={animated ? 'animate-draw' : undefined}
              />
              {/* Inner ring */}
              <circle
                cx="50"
                cy="50"
                r="27"
                pathLength={100}
                stroke={`url(#${gradId})`}
                strokeWidth={strokeWidth}
                className={animated ? 'animate-draw-delayed' : undefined}
              />
              {/* Crosshair markers */}
              <line x1="50" y1="12" x2="50" y2="18" stroke={color} strokeWidth="1.5" />
              <line x1="50" y1="82" x2="50" y2="88" stroke={color} strokeWidth="1.5" />
              <line x1="12" y1="50" x2="18" y2="50" stroke={color} strokeWidth="1.5" />
              <line x1="82" y1="50" x2="88" y2="50" stroke={color} strokeWidth="1.5" />
            </>
          ) : (
            /* Neon-Glow / Bold-Solid O */
            <>
              {/* Ambient diffuse back ring */}
              <circle
                cx="50"
                cy="50"
                r="30"
                pathLength={100}
                stroke={color}
                strokeWidth={strokeWidth * 1.5}
                strokeOpacity={markStyle === 'bold-solid' ? '0.4' : '0.25'}
                strokeLinecap="round"
              />

              {/* Sharp gradient ring */}
              <circle
                cx="50"
                cy="50"
                r="30"
                pathLength={100}
                stroke={`url(#${gradId})`}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                className={animated ? 'animate-draw' : undefined}
                style={{
                  transformOrigin: '50% 50%',
                  transform: 'rotate(-90deg)',
                }}
              />
            </>
          )
        )}
      </svg>

      {/* In Infinite Mode: badge indicating age */}
      {orderNumber !== undefined && (
        <span
          className={`absolute -bottom-1 -right-1 text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold shadow-md tracking-wider ${
            isExpiring
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/60 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
              : 'bg-slate-900/90 text-slate-400 border border-slate-700/60'
          }`}
        >
          {isExpiring ? 'Next Off' : `#${orderNumber}`}
        </span>
      )}
    </div>
  );
};
