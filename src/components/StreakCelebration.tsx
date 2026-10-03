import React, { useEffect, useRef, useState } from 'react';
import { Flame, Trophy, Sparkles, ArrowRight, Zap, Star } from 'lucide-react';
import { sound } from '../utils/audio';

interface StreakCelebrationProps {
  streakCount: number;
  onClose: () => void;
}

interface EmberParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  wobble: number;
}

interface ShockwaveRing {
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
  lineWidth: number;
}

export const StreakCelebration: React.FC<StreakCelebrationProps> = ({
  streakCount,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [step, setStep] = useState<number>(0); // 0: initial, 1: star 1, 2: star 2, 3: star 3 & full banner
  const [showButton, setShowButton] = useState<boolean>(false);

  // Sound and staged sequence timing
  useEffect(() => {
    sound.playStreakFanfare();

    // Sequence stages
    const t1 = setTimeout(() => {
      setStep(1);
      sound.playStreakStarImpact(1);
    }, 450);

    const t2 = setTimeout(() => {
      setStep(2);
      sound.playStreakStarImpact(2);
    }, 950);

    const t3 = setTimeout(() => {
      setStep(3);
      sound.playStreakStarImpact(3);
    }, 1500);

    const t4 = setTimeout(() => {
      setShowButton(true);
    }, 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  // Canvas visual effects (Flaming Embers, Radial Solar Corona & Shockwaves)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle arrays
    const embers: EmberParticle[] = [];
    const shockwaves: ShockwaveRing[] = [];
    const colors = ['#f59e0b', '#f97316', '#ef4444', '#fbbf24', '#ffffff', '#e11d48'];

    // Spawn initial shockwave from center
    shockwaves.push(
      { radius: 10, maxRadius: Math.max(width, height) * 0.7, alpha: 1, color: '#f59e0b', lineWidth: 8 },
      { radius: 5, maxRadius: Math.max(width, height) * 0.6, alpha: 0.9, color: '#ef4444', lineWidth: 5 },
      { radius: 1, maxRadius: Math.max(width, height) * 0.5, alpha: 0.8, color: '#fbbf24', lineWidth: 4 }
    );

    // Continuous ember spawner
    let lastTime = performance.now();
    let spawnAccumulator = 0;

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Clear with slight trailing fade
      ctx.clearRect(0, 0, width, height);

      // Spawn rising embers from bottom and center explosion
      spawnAccumulator += dt * 120;
      while (spawnAccumulator >= 1) {
        spawnAccumulator -= 1;

        // Bottom embers
        embers.push({
          x: Math.random() * width,
          y: height + 10,
          vx: (Math.random() - 0.5) * 120,
          vy: -(150 + Math.random() * 260),
          size: 2 + Math.random() * 5.5,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 0.8 + Math.random() * 0.2,
          life: 0,
          maxLife: 1.8 + Math.random() * 1.6,
          wobble: Math.random() * Math.PI * 2,
        });

        // Center radial sparks
        const angle = Math.random() * Math.PI * 2;
        const speed = 100 + Math.random() * 320;
        embers.push({
          x: width / 2 + (Math.random() - 0.5) * 40,
          y: height / 2 + (Math.random() - 0.5) * 40,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2.5 + Math.random() * 5,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          life: 0,
          maxLife: 1.2 + Math.random() * 1.2,
          wobble: Math.random() * Math.PI * 2,
        });
      }

      // Draw and update Shockwaves
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.radius += dt * 450;
        sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);

        ctx.save();
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = sw.lineWidth * sw.alpha;
        ctx.globalAlpha = sw.alpha * 0.85;
        ctx.shadowColor = sw.color;
        ctx.shadowBlur = 25;
        ctx.stroke();
        ctx.restore();

        if (sw.radius >= sw.maxRadius) {
          shockwaves.splice(i, 1);
        }
      }

      // Draw and update Embers
      for (let i = embers.length - 1; i >= 0; i--) {
        const p = embers[i];
        p.life += dt;
        p.x += (p.vx + Math.sin(p.wobble + p.life * 4) * 35) * dt;
        p.y += p.vy * dt;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.restore();

        if (p.life >= p.maxLife || p.y < -30) {
          embers.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-label="3-Win Streak Celebration"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-300 overflow-hidden select-none"
    >
      {/* Background Interactive Fiery Embers & Shockwave Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />

      {/* Fiery Solar Atmosphere Radial Flare */}
      <div className="absolute inset-0 bg-radial from-amber-500/25 via-rose-600/15 to-transparent pointer-events-none animate-pulse" />

      {/* Main Staged Presentation Card */}
      <div className="relative z-10 w-full max-w-md mx-auto text-center flex flex-col items-center">
        {/* Animated Fiery Emblem */}
        <div className="relative mb-5 flex items-center justify-center">
          {/* Rotating Radiant Corona Rays */}
          <div className="absolute -inset-8 bg-gradient-to-tr from-amber-500/40 via-orange-500/30 to-rose-600/40 rounded-full blur-2xl animate-spin duration-[9000ms] pointer-events-none" />

          {/* Central Blazing Badge */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-700 p-1 shadow-[0_0_50px_rgba(245,158,11,0.6)] flex items-center justify-center animate-bounce duration-1000">
            <div className="w-full h-full rounded-[22px] bg-slate-950/90 flex flex-col items-center justify-center border border-amber-400/40 relative overflow-hidden">
              {/* Flame icon */}
              <Flame className="w-14 h-14 text-amber-400 fill-amber-500 drop-shadow-[0_0_16px_rgba(245,158,11,0.9)] animate-pulse" />

              {/* Badge 3X indicator */}
              <div className="absolute bottom-2 font-display font-black text-xs uppercase tracking-widest text-amber-300 drop-shadow-md">
                3X STREAK
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Staged Title */}
        <div className="space-y-1 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/30 to-rose-500/20 border border-amber-500/50 shadow-lg text-amber-300 text-xs font-bold tracking-widest uppercase mb-2 animate-in zoom-in-75 duration-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>TRIFECTA UNLOCKED</span>
          </div>

          <h2 className="font-display text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-amber-500 tracking-tight drop-shadow-[0_4px_20px_rgba(245,158,11,0.5)]">
            3-WIN STREAK!
          </h2>

          <p className="text-sm font-bold text-amber-400 tracking-wide uppercase">
            🔥 ON FIRE · UNSTOPPABLE DOMINANCE 🔥
          </p>

          <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed pt-1">
            Three consecutive victories secured! Your strategic precision is burning through the arena.
          </p>
        </div>

        {/* 3 Victory Embers / Star Nodes Slam Sequence */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-xs mb-8">
          {[
            { num: 1, label: 'WIN 1', subtitle: 'Ignited' },
            { num: 2, label: 'WIN 2', subtitle: 'Blazing' },
            { num: 3, label: 'WIN 3', subtitle: 'Inferno' },
          ].map((item) => {
            const isLit = step >= item.num;
            return (
              <div
                key={item.num}
                className={`p-3 rounded-2xl border transition-all duration-300 text-center relative ${
                  isLit
                    ? 'bg-gradient-to-b from-amber-500/30 to-rose-500/30 border-amber-400 text-amber-200 shadow-[0_0_25px_rgba(245,158,11,0.5)] scale-105 ring-1 ring-amber-400'
                    : 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-50'
                }`}
              >
                <div className="flex justify-center mb-1">
                  <Star
                    className={`w-6 h-6 transition-all duration-300 ${
                      isLit
                        ? 'text-amber-300 fill-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)] scale-110'
                        : 'text-slate-600'
                    }`}
                  />
                </div>
                <div className="font-display font-extrabold text-xs tracking-wider text-white">
                  {item.label}
                </div>
                <div className="text-[10px] text-amber-400/80 font-medium">
                  {isLit ? item.subtitle : 'Locked'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button: Continue Playing */}
        <div className="w-full max-w-xs transition-all duration-300">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-display font-extrabold text-sm text-slate-950 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 hover:from-amber-300 hover:to-orange-300 shadow-[0_0_30px_rgba(245,158,11,0.6)] active:scale-95 transition-all cursor-pointer group"
          >
            <span>KEEP THE STREAK ALIVE</span>
            <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
