import React, { useEffect, useRef } from 'react';
import { ThemeConfig, BackgroundCustomization, Player } from '../types/game';

interface ParticleBackgroundProps {
  theme: ThemeConfig;
  isDark?: boolean;
  customization?: BackgroundCustomization;
  winningPlayer?: Player | null;
}

interface Particle {
  x: number;
  y: number;
  z?: number;
  prevZ?: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  color: string;
  pulsePhase: number;
  pulseSpeed: number;
}

interface TrailParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type?: 'spark' | 'ripple';
  radius?: number;
}

// Victory explosion particle interface
interface VictoryConfetti {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  flipAngle: number;
  flipSpeed: number;
  alpha: number;
  decay: number;
  gravity: number;
  drag: number;
  wobblePhase: number;
  wobbleSpeed: number;
  wobbleAmp: number;
  shape: 'rect' | 'circle' | 'star';
  isGlowSpark?: boolean;
}

// Expanding shockwave ripple on victory
interface VictoryShockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  speed: number;
  lineWidth: number;
}

const DEFAULT_BG_CUSTOMIZATION: BackgroundCustomization = {
  bgTheme: 'deep-space',
  style: 'constellation',
  density: 'medium',
  speed: 'normal',
  trail: 'stardust',
  showGlowOrbs: true,
};

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  theme,
  isDark = true,
  customization = DEFAULT_BG_CUSTOMIZATION,
  winningPlayer,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const explosionTriggerRef = useRef<(originX?: number, originY?: number, winner?: Player | null) => void>(() => {});

  // Trigger explosion when winningPlayer prop changes to 'X' or 'O'
  useEffect(() => {
    if (winningPlayer) {
      explosionTriggerRef.current(undefined, undefined, winningPlayer);
    }
  }, [winningPlayer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse / touch coordinate tracker
    const mouse = {
      x: -9999,
      y: -9999,
      targetX: -9999,
      targetY: -9999,
      radius: 170,
      active: false,
    };

    const themeColors = isDark
      ? [theme.xColor, theme.oColor, '#ffffff', '#38bdf8']
      : [theme.xColor, theme.oColor, '#0f172a', '#0284c7'];

    // Speed multiplier calculation
    const speedMult =
      customization.speed === 'fast' ? 2.2 : customization.speed === 'slow' ? 0.45 : 1.0;

    // Density particle count calculation
    const densityMult =
      customization.density === 'high' ? 1.75 : customization.density === 'low' ? 0.5 : 1.0;

    const baseCount = Math.min(Math.floor((width * height) / 14000), 75);
    const particleCount = Math.max(18, Math.floor(baseCount * densityMult));

    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const z = Math.random() * width + 10;
      particles.push({
        x: (Math.random() - 0.5) * width * 1.5,
        y: (Math.random() - 0.5) * height * 1.5,
        z,
        prevZ: z,
        vx: (Math.random() - 0.5) * 0.45 * speedMult,
        vy: (Math.random() - 0.5) * 0.45 * speedMult,
        size: Math.random() * 2.2 + 1.2,
        baseAlpha: Math.random() * 0.35 + 0.2,
        color: themeColors[i % themeColors.length],
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: (Math.random() * 0.025 + 0.012) * speedMult,
      });
    }

    // Dynamic mouse/touch trail particles array
    const trailParticles: TrailParticle[] = [];
    const maxTrailCount = customization.trail === 'comet-ribbon' ? 90 : 50;

    // Victory Confetti and Shockwave Collections
    const victoryConfetti: VictoryConfetti[] = [];
    const victoryShockwaves: VictoryShockwave[] = [];

    // Confetti Palette based on Winning Player & Theme
    const getWinPalette = (winner?: Player | null) => {
      const primaryColor = winner === 'O' ? theme.oColor : theme.xColor;
      const secondaryColor = winner === 'O' ? theme.xColor : theme.oColor;
      return [
        primaryColor,
        secondaryColor,
        '#f59e0b', // Radiant Gold
        '#fbbf24', // Amber
        '#ec4899', // Hot Pink
        '#06b6d4', // Electric Cyan
        '#10b981', // Emerald
        '#a855f7', // Vivid Violet
        '#ffffff', // Sparkle White
      ];
    };

    // Helper to spawn a single confetti piece
    const spawnConfettiPiece = (
      originX: number,
      originY: number,
      angle: number,
      speed: number,
      colors: string[],
      isRadial: boolean = false
    ) => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const isStar = Math.random() < 0.22;
      const isCircle = !isStar && Math.random() < 0.25;
      const isGlowSpark = isRadial && Math.random() < 0.4;

      const baseWidth = isStar ? 9 : isCircle ? 6 : Math.random() * 6 + 6;
      const baseHeight = isStar ? 9 : isCircle ? 6 : Math.random() * 10 + 7;

      victoryConfetti.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
        vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 2,
        width: baseWidth,
        height: baseHeight,
        color,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.16,
        flipAngle: Math.random() * Math.PI * 2,
        flipSpeed: (Math.random() * 0.18 + 0.08) * (Math.random() > 0.5 ? 1 : -1),
        alpha: 1.0,
        decay: Math.random() * 0.006 + 0.007,
        gravity: isRadial ? 0.15 : 0.22,
        drag: isRadial ? 0.94 : 0.982,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.08 + 0.04,
        wobbleAmp: Math.random() * 1.5 + 0.8,
        shape: isStar ? 'star' : isCircle ? 'circle' : 'rect',
        isGlowSpark,
      });
    };

    // Primary Victory Explosion Orchestrator
    const triggerVictoryExplosion = (
      customX?: number,
      customY?: number,
      winner?: Player | null
    ) => {
      const palette = getWinPalette(winner);
      const centerX = customX ?? width / 2;
      const centerY = customY ?? height / 2;
      const accent = winner === 'O' ? theme.oColor : theme.xColor;

      // 1. Expanding Core Shockwaves from Board Center
      victoryShockwaves.push({
        x: centerX,
        y: centerY,
        radius: 10,
        maxRadius: Math.max(width, height) * 0.65,
        color: accent,
        alpha: 0.9,
        speed: 9.5,
        lineWidth: 5,
      });

      setTimeout(() => {
        victoryShockwaves.push({
          x: centerX,
          y: centerY,
          radius: 10,
          maxRadius: Math.max(width, height) * 0.5,
          color: '#fbbf24',
          alpha: 0.85,
          speed: 8.0,
          lineWidth: 3.5,
        });
      }, 120);

      // 2. Radial Nova Burst from Center (70 particles)
      for (let i = 0; i < 70; i++) {
        const angle = (Math.PI * 2 * i) / 70 + (Math.random() - 0.5) * 0.2;
        const speed = Math.random() * 12 + 6;
        spawnConfettiPiece(centerX, centerY, angle, speed, palette, true);
      }

      // 3. Left Cannon Blast (Angled upward across screen at +100ms)
      setTimeout(() => {
        const leftX = width * 0.12;
        const leftY = height * 0.82;
        victoryShockwaves.push({
          x: leftX,
          y: leftY,
          radius: 8,
          maxRadius: 280,
          color: theme.xColor,
          alpha: 0.75,
          speed: 6.5,
          lineWidth: 3,
        });

        for (let i = 0; i < 50; i++) {
          const angle = -Math.PI / 3 + (Math.random() - 0.5) * 0.7; // ~60 degrees upward
          const speed = Math.random() * 15 + 8;
          spawnConfettiPiece(leftX, leftY, angle, speed, palette);
        }
      }, 100);

      // 4. Right Cannon Blast (Angled upward across screen at +220ms)
      setTimeout(() => {
        const rightX = width * 0.88;
        const rightY = height * 0.82;
        victoryShockwaves.push({
          x: rightX,
          y: rightY,
          radius: 8,
          maxRadius: 280,
          color: theme.oColor,
          alpha: 0.75,
          speed: 6.5,
          lineWidth: 3,
        });

        for (let i = 0; i < 50; i++) {
          const angle = (-2 * Math.PI) / 3 + (Math.random() - 0.5) * 0.7; // ~120 degrees upward
          const speed = Math.random() * 15 + 8;
          spawnConfettiPiece(rightX, rightY, angle, speed, palette);
        }
      }, 220);

      // 5. Crown Shimmer Shower from Top Center at +340ms
      setTimeout(() => {
        for (let i = 0; i < 35; i++) {
          const topX = width * 0.5 + (Math.random() - 0.5) * (width * 0.4);
          const topY = -20;
          const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.8;
          const speed = Math.random() * 6 + 2;
          spawnConfettiPiece(topX, topY, angle, speed, palette);
        }
      }, 340);
    };

    // Attach to ref for prop triggers
    explosionTriggerRef.current = triggerVictoryExplosion;

    // Listen for custom event 'apex_win_explosion'
    const handleCustomWinEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ originX?: number; originY?: number; winner?: Player | null }>;
      triggerVictoryExplosion(customEvent.detail?.originX, customEvent.detail?.originY, customEvent.detail?.winner);
    };
    window.addEventListener('apex_win_explosion', handleCustomWinEvent);

    // Helper to spawn a trail particle
    const spawnTrailParticle = (x: number, y: number, spread: number = 1.5) => {
      if (customization.trail === 'none') return;

      if (customization.trail === 'pulse-ripple') {
        trailParticles.push({
          x,
          y,
          vx: 0,
          vy: 0,
          size: 2,
          radius: 5,
          color: Math.random() > 0.5 ? theme.xColor : theme.oColor,
          alpha: 0.9,
          life: 1.0,
          maxLife: 32,
          type: 'ripple',
        });
        return;
      }

      if (trailParticles.length >= maxTrailCount) {
        trailParticles.shift();
      }

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * spread;
      const color = Math.random() > 0.4 ? theme.xColor : theme.oColor;

      trailParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: customization.trail === 'comet-ribbon' ? Math.random() * 3.5 + 2 : Math.random() * 2.5 + 1.2,
        color,
        alpha: 0.9,
        life: 1.0,
        maxLife: customization.trail === 'comet-ribbon' ? 36 : 24,
        type: 'spark',
      });
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    let trailThrottleCounter = 0;

    const handlePointerMove = (clientX: number, clientY: number) => {
      mouse.targetX = clientX;
      mouse.targetY = clientY;
      mouse.active = true;

      if (!prefersReducedMotion && customization.trail !== 'none') {
        trailThrottleCounter++;
        if (trailThrottleCounter % 2 === 0) {
          spawnTrailParticle(clientX, clientY, 2.0);
          if (customization.trail === 'comet-ribbon' || Math.random() > 0.5) {
            spawnTrailParticle(clientX + (Math.random() - 0.5) * 8, clientY + (Math.random() - 0.5) * 8, 1.2);
          }
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      handlePointerMove(e.clientX, e.clientY);
    };

    const handleMouseLeave = () => {
      mouse.targetX = -9999;
      mouse.targetY = -9999;
      mouse.active = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchEnd = () => {
      mouse.targetX = -9999;
      mouse.targetY = -9999;
      mouse.active = false;
    };

    // Burst of particles on click/touch
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (prefersReducedMotion || customization.trail === 'none') return;
      let x = 0;
      let y = 0;
      if ('clientX' in e) {
        x = e.clientX;
        y = e.clientY;
      } else if (e.touches && e.touches[0]) {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
      }
      if (x && y) {
        if (customization.trail === 'pulse-ripple') {
          for (let r = 0; r < 3; r++) {
            setTimeout(() => {
              trailParticles.push({
                x,
                y,
                vx: 0,
                vy: 0,
                size: 2,
                radius: 6 + r * 12,
                color: theme.xColor,
                alpha: 0.95,
                life: 1.0,
                maxLife: 35,
                type: 'ripple',
              });
            }, r * 75);
          }
        } else {
          for (let i = 0; i < 12; i++) {
            spawnTrailParticle(x, y, 4.0);
          }
        }
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('touchstart', handlePointerDown, { passive: true });

    let waveTime = 0;

    // Helper to draw a 5-pointed star
    const drawStar = (context: CanvasRenderingContext2D, radius: number) => {
      context.beginPath();
      for (let i = 0; i < 5; i++) {
        const outerAngle = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const innerAngle = outerAngle + Math.PI / 5;
        const outerX = Math.cos(outerAngle) * radius;
        const outerY = Math.sin(outerAngle) * radius;
        const innerX = Math.cos(innerAngle) * (radius * 0.45);
        const innerY = Math.sin(innerAngle) * (radius * 0.45);

        if (i === 0) {
          context.moveTo(outerX, outerY);
        } else {
          context.lineTo(outerX, outerY);
        }
        context.lineTo(innerX, innerY);
      }
      context.closePath();
      context.fill();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse tracking with inertia
      if (mouse.active) {
        mouse.x += (mouse.targetX - mouse.x) * 0.15;
        mouse.y += (mouse.targetY - mouse.y) * 0.15;
      } else {
        mouse.x = -9999;
        mouse.y = -9999;
      }

      waveTime += 0.018 * speedMult;

      // 1. Render Background Engine Modes
      if (customization.style === 'cyber-grid') {
        const horizon = height * 0.58;
        const lineCount = 18;
        const gridAlpha = isDark ? 0.35 : 0.2;

        ctx.strokeStyle = theme.xColor;
        ctx.lineWidth = 1.2;

        for (let i = -lineCount; i <= lineCount; i++) {
          const xBottom = width / 2 + i * (width / 12);
          ctx.beginPath();
          ctx.moveTo(width / 2, horizon);
          ctx.lineTo(xBottom, height);
          ctx.globalAlpha = gridAlpha * (1 - Math.abs(i) / (lineCount * 1.1));
          ctx.stroke();
        }

        const travel = (waveTime * 35) % 1;
        const totalHorizontal = 10;
        for (let j = 1; j <= totalHorizontal; j++) {
          const prog = Math.min(1, Math.max(0, (j + travel) / totalHorizontal));
          const y = horizon + Math.pow(prog, 2.2) * (height - horizon);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.globalAlpha = gridAlpha * prog;
          ctx.stroke();
        }

        const horizonGrad = ctx.createLinearGradient(0, horizon - 40, 0, horizon + 20);
        horizonGrad.addColorStop(0, 'transparent');
        horizonGrad.addColorStop(0.7, theme.xColor);
        horizonGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = horizonGrad;
        ctx.globalAlpha = isDark ? 0.18 : 0.08;
        ctx.fillRect(0, horizon - 40, width, 60);

        for (let i = 0; i < Math.floor(particles.length * 0.6); i++) {
          const p = particles[i];
          const px = ((p.x + width) % width);
          const py = ((p.y + horizon) % horizon);
          ctx.beginPath();
          ctx.arc(px, py, p.size * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = (isDark ? 0.4 : 0.25) * Math.abs(Math.sin(p.pulsePhase + waveTime));
          ctx.fill();
        }
      } else if (customization.style === 'aurora-waves') {
        for (let w = 0; w < 4; w++) {
          ctx.beginPath();
          ctx.moveTo(0, height * (0.25 + w * 0.14));
          for (let x = 0; x <= width; x += 25) {
            const y =
              height * (0.3 + w * 0.14) +
              Math.sin(x * 0.0035 + waveTime * 1.2 + w * 0.8) * 75 +
              Math.cos(x * 0.006 - waveTime * 0.8) * 35;
            ctx.lineTo(x, y);
          }
          ctx.strokeStyle =
            w === 0 ? theme.xColor : w === 1 ? theme.oColor : w === 2 ? '#818cf8' : '#c084fc';
          ctx.globalAlpha = isDark ? 0.22 : 0.14;
          ctx.lineWidth = 38;
          ctx.stroke();
        }

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.y -= 0.3 * speedMult;
          if (p.y < 0) p.y = height;
          ctx.beginPath();
          ctx.arc((p.x + width) % width, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = isDark ? 0.35 : 0.2;
          ctx.fill();
        }
      } else if (customization.style === 'warp-speed') {
        const cx = width / 2;
        const cy = height / 2;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          if (!p.z || p.z <= 0) {
            p.z = width;
            p.prevZ = width;
            p.x = (Math.random() - 0.5) * width * 1.5;
            p.y = (Math.random() - 0.5) * height * 1.5;
          }

          p.prevZ = p.z;
          p.z -= 6 * speedMult;

          if (p.z <= 0) {
            p.z = width;
            p.prevZ = width;
            p.x = (Math.random() - 0.5) * width * 1.5;
            p.y = (Math.random() - 0.5) * height * 1.5;
          }

          const k = 220 / p.z;
          const prevK = 220 / (p.prevZ || p.z + 6);
          const px = p.x * k + cx;
          const py = p.y * k + cy;
          const prevX = p.x * prevK + cx;
          const prevY = p.y * prevK + cy;

          if (px >= 0 && px <= width && py >= 0 && py <= height) {
            const alpha = Math.min(1, Math.max(0.15, (1 - p.z / width) * 1.2));

            ctx.beginPath();
            ctx.moveTo(prevX, prevY);
            ctx.lineTo(px, py);
            ctx.strokeStyle = p.color;
            ctx.lineWidth = Math.max(1, (1 - p.z / width) * 3);
            ctx.globalAlpha = isDark ? alpha : alpha * 0.7;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(px, py, Math.max(1, (1 - p.z / width) * 2.5), 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = isDark ? alpha : alpha * 0.8;
            ctx.fill();
          }
        }
      } else {
        // 'constellation' and 'minimal-mesh' modes
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          if (p.x < 0) p.x += width;
          if (p.x > width) p.x -= width;
          if (p.y < 0) p.y += height;
          if (p.y > height) p.y -= height;

          if (!prefersReducedMotion) {
            p.x += p.vx;
            p.y += p.vy;

            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < mouse.radius && dist > 0) {
              const force = (1 - dist / mouse.radius) * 4.5;
              p.x += (dx / dist) * force;
              p.y += (dy / dist) * force;
            }

            p.pulsePhase += p.pulseSpeed;
          }

          const currentAlpha = Math.min(
            1,
            Math.max(0.12, p.baseAlpha + Math.sin(p.pulsePhase) * 0.16)
          );

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = isDark ? currentAlpha : currentAlpha * 0.85;
          ctx.fill();

          if (customization.style === 'constellation') {
            for (let j = i + 1; j < particles.length; j++) {
              const p2 = particles[j];
              const distBetween = Math.hypot(p.x - p2.x, p.y - p2.y);
              const maxLinkDist = 110;

              if (distBetween < maxLinkDist) {
                const linkAlpha = (1 - distBetween / maxLinkDist) * (isDark ? 0.22 : 0.14);
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.strokeStyle = p.color;
                ctx.globalAlpha = linkAlpha;
                ctx.lineWidth = 1;
                ctx.stroke();
              }
            }
          }
        }
      }

      // 2. Draw and update interactive trail particles
      if (customization.trail !== 'none') {
        for (let i = trailParticles.length - 1; i >= 0; i--) {
          const tp = trailParticles[i];

          if (tp.type === 'ripple') {
            tp.radius = (tp.radius || 5) + 2.2;
            tp.life -= 1 / tp.maxLife;

            if (tp.life <= 0) {
              trailParticles.splice(i, 1);
              continue;
            }

            ctx.beginPath();
            ctx.arc(tp.x, tp.y, tp.radius, 0, Math.PI * 2);
            ctx.strokeStyle = tp.color;
            ctx.lineWidth = 2.2 * tp.life;
            ctx.globalAlpha = tp.alpha * tp.life;
            ctx.stroke();
          } else {
            tp.x += tp.vx;
            tp.y += tp.vy;
            tp.vx *= 0.95;
            tp.vy *= 0.95;
            tp.life -= 1 / tp.maxLife;

            if (tp.life <= 0) {
              trailParticles.splice(i, 1);
              continue;
            }

            const currentAlpha = tp.alpha * tp.life;
            const currentSize = tp.size * (0.35 + tp.life * 0.65);

            ctx.beginPath();
            ctx.arc(tp.x, tp.y, currentSize, 0, Math.PI * 2);
            ctx.fillStyle = tp.color;
            ctx.globalAlpha = currentAlpha;
            ctx.shadowBlur = 10;
            ctx.shadowColor = tp.color;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      // 3. Draw Victory Shockwaves
      for (let i = victoryShockwaves.length - 1; i >= 0; i--) {
        const sw = victoryShockwaves[i];
        sw.radius += sw.speed;
        sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);

        if (sw.alpha <= 0.01 || sw.radius >= sw.maxRadius) {
          victoryShockwaves.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = sw.lineWidth * sw.alpha;
        ctx.globalAlpha = sw.alpha * 0.8;
        ctx.shadowBlur = 15;
        ctx.shadowColor = sw.color;
        ctx.stroke();
        ctx.restore();
      }

      // 4. Draw & Animate Victory Confetti / Fireworks
      if (victoryConfetti.length > 0) {
        for (let i = victoryConfetti.length - 1; i >= 0; i--) {
          const c = victoryConfetti[i];

          // Physics integration
          c.vx *= c.drag;
          c.vy *= c.drag;
          c.vy += c.gravity;

          c.wobblePhase += c.wobbleSpeed;
          c.x += c.vx + Math.sin(c.wobblePhase) * c.wobbleAmp;
          c.y += c.vy;

          c.rotation += c.rotationSpeed;
          c.flipAngle += c.flipSpeed;
          c.alpha -= c.decay;

          // Out of screen or faded
          if (c.alpha <= 0 || c.y > height + 40) {
            victoryConfetti.splice(i, 1);
            continue;
          }

          // 3D paper flutter simulation
          const flipScale = Math.cos(c.flipAngle);

          ctx.save();
          ctx.translate(c.x, c.y);
          ctx.rotate(c.rotation);
          ctx.scale(flipScale, 1);
          ctx.globalAlpha = Math.max(0, Math.min(1, c.alpha));
          ctx.fillStyle = c.color;

          if (c.isGlowSpark) {
            ctx.shadowBlur = 12;
            ctx.shadowColor = c.color;
          }

          if (c.shape === 'star') {
            drawStar(ctx, c.width * 0.8);
          } else if (c.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, c.width * 0.5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Rectangular ribbon
            ctx.fillRect(-c.width / 2, -c.height / 2, c.width, c.height);
          }

          ctx.restore();
        }
      }

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('apex_win_explosion', handleCustomWinEvent);
    };
  }, [
    theme.id,
    theme.xColor,
    theme.oColor,
    isDark,
    customization.style,
    customization.density,
    customization.speed,
    customization.trail,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 w-full h-full"
      aria-hidden="true"
    />
  );
};
