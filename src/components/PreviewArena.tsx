import React, { useState, useEffect, useRef } from 'react';
import {
  ThemeConfig,
  BoardCustomization,
  BackgroundCustomization,
  CellValue,
  Player,
} from '../types/game';
import { BACKGROUND_THEMES } from '../utils/theme';
import { MarkIcon } from './MarkIcon';
import { Sparkles, Eye, RotateCcw } from 'lucide-react';

interface PreviewArenaProps {
  theme: ThemeConfig;
  boardCustomization: BoardCustomization;
  backgroundCustomization: BackgroundCustomization;
  isDark?: boolean;
}

export const PreviewArena: React.FC<PreviewArenaProps> = ({
  theme,
  boardCustomization,
  backgroundCustomization,
  isDark = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Interactive mock board state for testing marks live in preview!
  const [previewBoard, setPreviewBoard] = useState<CellValue[]>([
    'X',
    null,
    'O',
    null,
    'X',
    null,
    'O',
    null,
    null,
  ]);
  const [nextPlayer, setNextPlayer] = useState<Player>('X');

  const bgConfig =
    BACKGROUND_THEMES[backgroundCustomization.bgTheme] || BACKGROUND_THEMES['deep-space'];

  // Handle clicking a cell inside the live preview
  const handleCellClick = (index: number) => {
    setPreviewBoard((prev) => {
      const copy = [...prev];
      if (copy[index] === null) {
        copy[index] = nextPlayer;
        setNextPlayer(nextPlayer === 'X' ? 'O' : 'X');
      } else {
        copy[index] = null;
      }
      return copy;
    });
  };

  const handleResetPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewBoard(['X', null, 'O', null, 'X', null, 'O', null, null]);
    setNextPlayer('X');
  };

  // Mini Canvas Animation Engine for Preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const w = (canvas.width = canvas.parentElement?.clientWidth || 320);
    const h = (canvas.height = canvas.parentElement?.clientHeight || 200);

    const themeColors = isDark
      ? [theme.xColor, theme.oColor, '#ffffff']
      : [theme.xColor, theme.oColor, '#475569'];

    const speedMult =
      backgroundCustomization.speed === 'fast'
        ? 2.2
        : backgroundCustomization.speed === 'slow'
        ? 0.5
        : 1.0;

    // Mini particles pool
    const count = backgroundCustomization.density === 'high' ? 40 : backgroundCustomization.density === 'low' ? 14 : 24;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      z: Math.random() * w,
      vx: (Math.random() - 0.5) * 0.4 * speedMult,
      vy: (Math.random() - 0.5) * 0.4 * speedMult,
      size: Math.random() * 2 + 1,
      color: themeColors[Math.floor(Math.random() * themeColors.length)],
      alpha: Math.random() * 0.5 + 0.25,
      pulse: Math.random() * Math.PI,
    }));

    let t = 0;

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      t += 0.02 * speedMult;

      if (backgroundCustomization.style === 'cyber-grid') {
        // Horizon cyber floor
        const horizon = h * 0.5;
        ctx.strokeStyle = theme.xColor;
        ctx.lineWidth = 1;

        for (let i = -7; i <= 7; i++) {
          const xBottom = w / 2 + i * (w / 8);
          ctx.beginPath();
          ctx.moveTo(w / 2, horizon);
          ctx.lineTo(xBottom, h);
          ctx.globalAlpha = 0.25 * (1 - Math.abs(i) / 9);
          ctx.stroke();
        }

        const offset = (t * 15) % (h - horizon);
        for (let j = 1; j <= 6; j++) {
          const y = horizon + Math.pow(j / 6, 2) * (h - horizon);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.globalAlpha = 0.12 * (j / 6);
          ctx.stroke();
        }
      } else if (backgroundCustomization.style === 'aurora-waves') {
        // Fluid waves
        for (let wave = 0; wave < 3; wave++) {
          ctx.beginPath();
          ctx.moveTo(0, h * 0.4);
          for (let x = 0; x <= w; x += 15) {
            const y =
              h * (0.35 + wave * 0.15) +
              Math.sin(x * 0.015 + t + wave) * 20 +
              Math.cos(x * 0.02 - t) * 10;
            ctx.lineTo(x, y);
          }
          ctx.strokeStyle = wave === 0 ? theme.xColor : wave === 1 ? theme.oColor : '#a855f7';
          ctx.globalAlpha = 0.2;
          ctx.lineWidth = 18;
          ctx.stroke();
        }
      } else if (backgroundCustomization.style === 'warp-speed') {
        // 3D forward stars
        const cx = w / 2;
        const cy = h / 2;

        particles.forEach((p) => {
          p.z -= 3 * speedMult;
          if (p.z <= 0) {
            p.z = w;
            p.x = (Math.random() - 0.5) * w;
            p.y = (Math.random() - 0.5) * h;
          }

          const k = 150 / p.z;
          const px = p.x * k + cx;
          const py = p.y * k + cy;

          if (px >= 0 && px <= w && py >= 0 && py <= h) {
            const size = Math.max(0.6, (1 - p.z / w) * 2.5);
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = 1 - p.z / w;
            ctx.fill();
          }
        });
      } else {
        // Constellation or Zen Dust
        particles.forEach((p, idx) => {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) p.x = w;
          if (p.x > w) p.x = 0;
          if (p.y < 0) p.y = h;
          if (p.y > h) p.y = 0;

          p.pulse += 0.03 * speedMult;
          const alpha = p.alpha + Math.sin(p.pulse) * 0.15;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0.1, alpha);
          ctx.fill();

          if (backgroundCustomization.style === 'constellation') {
            for (let j = idx + 1; j < particles.length; j++) {
              const p2 = particles[j];
              const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
              if (dist < 60) {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.strokeStyle = p.color;
                ctx.globalAlpha = (1 - dist / 60) * 0.25;
                ctx.lineWidth = 0.7;
                ctx.stroke();
              }
            }
          }
        });
      }

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    theme.id,
    theme.xColor,
    theme.oColor,
    isDark,
    backgroundCustomization.style,
    backgroundCustomization.density,
    backgroundCustomization.speed,
  ]);

  // Compute Board Chassis styling for preview
  const getChassisClasses = () => {
    switch (boardCustomization.style) {
      case 'cyber-matrix':
        return 'rounded-xl bg-slate-950/95 border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]';
      case 'minimal-clean':
        return 'rounded-xl bg-transparent border-0 shadow-none';
      case 'tactile-wood':
        return 'rounded-2xl bg-amber-950/90 dark:bg-[#1a120b] border-2 border-amber-900/60 shadow-lg';
      case 'glass-stadium':
      default:
        return 'rounded-2xl bg-white/85 dark:bg-slate-900/85 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-md';
    }
  };

  // Compute Cell Surface styling for preview
  const getCellClasses = (isOccupied: boolean) => {
    let base = 'relative rounded-lg flex items-center justify-center border transition-all select-none cursor-pointer';

    switch (boardCustomization.cellFinish) {
      case 'deep-gloss':
        base += ' bg-gradient-to-b from-white/90 via-slate-100/90 to-slate-200/90 dark:from-slate-800/95 dark:via-slate-900/90 dark:to-slate-950 border-white/40 dark:border-slate-700/60 shadow-sm';
        break;
      case 'matte-stealth':
        base += ' bg-slate-200/70 dark:bg-slate-950/90 border-slate-300 dark:border-slate-800/80';
        break;
      case 'frosted-glass':
      default:
        base += ' bg-slate-50/90 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800/80 shadow-inner';
        break;
    }

    if (!isOccupied) {
      base += ' hover:border-cyan-400/80 hover:scale-105 active:scale-95';
    }

    return base;
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl p-4 bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Background Visual Backdrop Preview */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${bgConfig.previewGradient} transition-colors duration-500`}
      />

      {/* Mini Canvas running background visual effect */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-85"
      />

      {/* Ambient Orbs Preview */}
      {backgroundCustomization.showGlowOrbs && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-6 -right-6 w-36 h-36 rounded-full blur-2xl opacity-35"
            style={{ backgroundColor: bgConfig.ambientOrbs.orb1 }}
          />
          <div
            className="absolute -bottom-6 -left-6 w-36 h-36 rounded-full blur-2xl opacity-35"
            style={{ backgroundColor: bgConfig.ambientOrbs.orb2 }}
          />
        </div>
      )}

      {/* Header Info Overlay */}
      <div className="relative z-10 flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-white tracking-wide">
          <Eye className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Live Interactive Preview</span>
          <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 font-mono">
            {theme.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetPreview}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors flex items-center gap-1 text-[11px]"
            title="Reset sample marks"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Live Mini Board Preview */}
      <div className="relative z-10 flex items-center justify-center py-2">
        <div className="relative w-44 sm:w-48 aspect-square transition-all duration-300">
          {/* Turn aura glow */}
          {boardCustomization.showTurnGlow && (
            <div
              className="absolute -inset-2 rounded-2xl opacity-25 blur-xl pointer-events-none transition-all duration-500"
              style={{
                backgroundColor: nextPlayer === 'X' ? theme.xColor : theme.oColor,
              }}
            />
          )}

          {/* Chassis */}
          <div className={`w-full h-full p-2.5 ${getChassisClasses()}`}>
            {/* Cyber Matrix Corner Brackets */}
            {boardCustomization.style === 'cyber-matrix' && (
              <>
                <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
                <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
                <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
                <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />
              </>
            )}

            {/* Grid */}
            <div className="grid grid-cols-3 gap-1.5 w-full h-full">
              {previewBoard.map((cell, idx) => (
                <div
                  key={idx}
                  onClick={() => handleCellClick(idx)}
                  className={getCellClasses(!!cell)}
                  title={cell ? `Occupied by ${cell}` : 'Click to place mark'}
                >
                  {cell ? (
                    <MarkIcon
                      player={cell}
                      theme={theme}
                      size="sm"
                      markStyle={boardCustomization.markStyle}
                      animated={false}
                    />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500/20 group-hover:bg-cyan-400/40" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Meta Bar */}
      <div className="relative z-10 mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="truncate">
          Board: <strong className="text-slate-200 capitalize">{boardCustomization.style.replace('-', ' ')}</strong> · Finish: <strong className="text-slate-200 capitalize">{boardCustomization.cellFinish.replace('-', ' ')}</strong>
        </span>
        <span className="text-[10px] text-cyan-400/90 font-mono">Click cells to test</span>
      </div>
    </div>
  );
};
