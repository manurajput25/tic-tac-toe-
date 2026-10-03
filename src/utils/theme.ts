import { ThemeConfig, ThemeId, BackgroundThemeId } from '../types/game';

export interface EnhancedThemeConfig extends ThemeConfig {
  xGradient: string;
  oGradient: string;
  cardGlow: string;
  ambientLight: string;
}

export interface BackgroundThemeConfig {
  id: BackgroundThemeId;
  name: string;
  desc: string;
  cssBg: string;
  ambientOrbs: { orb1: string; orb2: string; orb3: string };
  previewGradient: string;
}

export const THEMES: Record<ThemeId, EnhancedThemeConfig> = {
  'cyber-neon': {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    xColor: '#06b6d4',
    xGlow: 'rgba(6, 182, 212, 0.6)',
    xGradient: 'from-cyan-400 via-sky-400 to-blue-500',
    oColor: '#f43f5e',
    oGlow: 'rgba(244, 63, 94, 0.6)',
    oGradient: 'from-rose-400 via-pink-500 to-fuchsia-500',
    accentBg: 'from-cyan-950/30 via-slate-900/50 to-rose-950/30',
    gridBorder: 'border-cyan-500/20',
    cellBg: 'bg-slate-900/70',
    cellHover: 'hover:bg-slate-800/90',
    cardGlow: 'rgba(6, 182, 212, 0.15)',
    ambientLight: 'rgba(6, 182, 212, 0.12)',
  },
  'sunset-amber': {
    id: 'sunset-amber',
    name: 'Sunset Glow',
    xColor: '#f59e0b',
    xGlow: 'rgba(245, 158, 11, 0.6)',
    xGradient: 'from-amber-300 via-amber-400 to-orange-500',
    oColor: '#a855f7',
    oGlow: 'rgba(168, 85, 247, 0.6)',
    oGradient: 'from-purple-400 via-fuchsia-500 to-indigo-500',
    accentBg: 'from-amber-950/30 via-slate-900/50 to-purple-950/30',
    gridBorder: 'border-amber-500/20',
    cellBg: 'bg-slate-900/70',
    cellHover: 'hover:bg-slate-800/90',
    cardGlow: 'rgba(245, 158, 11, 0.15)',
    ambientLight: 'rgba(245, 158, 11, 0.12)',
  },
  'emerald-blade': {
    id: 'emerald-blade',
    name: 'Emerald Blade',
    xColor: '#10b981',
    xGlow: 'rgba(16, 185, 129, 0.6)',
    xGradient: 'from-emerald-300 via-teal-400 to-cyan-500',
    oColor: '#0ea5e9',
    oGlow: 'rgba(14, 165, 233, 0.6)',
    oGradient: 'from-sky-400 via-blue-500 to-indigo-500',
    accentBg: 'from-emerald-950/30 via-slate-900/50 to-sky-950/30',
    gridBorder: 'border-emerald-500/20',
    cellBg: 'bg-slate-900/70',
    cellHover: 'hover:bg-slate-800/90',
    cardGlow: 'rgba(16, 185, 129, 0.15)',
    ambientLight: 'rgba(16, 185, 129, 0.12)',
  },
  'cosmic-gold': {
    id: 'cosmic-gold',
    name: 'Cosmic Gold',
    xColor: '#eab308',
    xGlow: 'rgba(234, 179, 8, 0.65)',
    xGradient: 'from-yellow-300 via-amber-400 to-yellow-600',
    oColor: '#38bdf8',
    oGlow: 'rgba(56, 189, 248, 0.65)',
    oGradient: 'from-sky-300 via-cyan-400 to-blue-500',
    accentBg: 'from-amber-950/30 via-slate-900/50 to-sky-950/30',
    gridBorder: 'border-amber-500/20',
    cellBg: 'bg-slate-900/70',
    cellHover: 'hover:bg-slate-800/90',
    cardGlow: 'rgba(234, 179, 8, 0.16)',
    ambientLight: 'rgba(234, 179, 8, 0.14)',
  },
  'synthwave-retro': {
    id: 'synthwave-retro',
    name: 'Synthwave 80s',
    xColor: '#f43f5e',
    xGlow: 'rgba(244, 63, 94, 0.65)',
    xGradient: 'from-pink-400 via-rose-500 to-purple-600',
    oColor: '#06b6d4',
    oGlow: 'rgba(6, 182, 212, 0.65)',
    oGradient: 'from-teal-300 via-cyan-400 to-blue-500',
    accentBg: 'from-fuchsia-950/30 via-slate-900/50 to-cyan-950/30',
    gridBorder: 'border-fuchsia-500/20',
    cellBg: 'bg-slate-900/70',
    cellHover: 'hover:bg-slate-800/90',
    cardGlow: 'rgba(244, 63, 94, 0.16)',
    ambientLight: 'rgba(244, 63, 94, 0.14)',
  },
  'crimson-shadow': {
    id: 'crimson-shadow',
    name: 'Crimson Shadow',
    xColor: '#ef4444',
    xGlow: 'rgba(239, 68, 68, 0.65)',
    xGradient: 'from-red-400 via-rose-500 to-orange-600',
    oColor: '#c084fc',
    oGlow: 'rgba(192, 132, 252, 0.65)',
    oGradient: 'from-purple-300 via-violet-400 to-fuchsia-500',
    accentBg: 'from-red-950/30 via-slate-900/50 to-purple-950/30',
    gridBorder: 'border-red-500/20',
    cellBg: 'bg-slate-900/70',
    cellHover: 'hover:bg-slate-800/90',
    cardGlow: 'rgba(239, 68, 68, 0.16)',
    ambientLight: 'rgba(239, 68, 68, 0.14)',
  },
  'monochrome': {
    id: 'monochrome',
    name: 'Platinum Minimal',
    xColor: '#f8fafc',
    xGlow: 'rgba(248, 250, 252, 0.5)',
    xGradient: 'from-white via-slate-200 to-slate-400',
    oColor: '#94a3b8',
    oGlow: 'rgba(148, 163, 184, 0.5)',
    oGradient: 'from-slate-200 via-slate-400 to-slate-500',
    accentBg: 'from-slate-900 via-slate-900/80 to-slate-900',
    gridBorder: 'border-slate-700/40',
    cellBg: 'bg-slate-900/80',
    cellHover: 'hover:bg-slate-800/95',
    cardGlow: 'rgba(255, 255, 255, 0.08)',
    ambientLight: 'rgba(255, 255, 255, 0.06)',
  },
};

export const BACKGROUND_THEMES: Record<BackgroundThemeId, BackgroundThemeConfig> = {
  'deep-space': {
    id: 'deep-space',
    name: 'Deep Space',
    desc: 'Obsidian void with celestial radiance',
    cssBg: 'bg-slate-950',
    ambientOrbs: {
      orb1: 'rgba(6, 182, 212, 0.16)',
      orb2: 'rgba(14, 116, 144, 0.12)',
      orb3: 'rgba(244, 63, 94, 0.1)',
    },
    previewGradient: 'from-slate-950 via-slate-900 to-slate-950',
  },
  'midnight-navy': {
    id: 'midnight-navy',
    name: 'Midnight Navy',
    desc: 'Deep oceanic indigo with azure aura',
    cssBg: 'bg-[#060b1c]',
    ambientOrbs: {
      orb1: 'rgba(59, 130, 246, 0.22)',
      orb2: 'rgba(99, 102, 241, 0.18)',
      orb3: 'rgba(147, 51, 234, 0.14)',
    },
    previewGradient: 'from-[#060b1c] via-[#0f172a] to-[#1e1b4b]',
  },
  'cyber-chamber': {
    id: 'cyber-chamber',
    name: 'Cyber Chamber',
    desc: 'Matrix teal & dark emerald core',
    cssBg: 'bg-[#031316]',
    ambientOrbs: {
      orb1: 'rgba(20, 184, 166, 0.24)',
      orb2: 'rgba(6, 182, 212, 0.2)',
      orb3: 'rgba(16, 185, 129, 0.16)',
    },
    previewGradient: 'from-[#031316] via-[#042429] to-[#083344]',
  },
  'crimson-abyss': {
    id: 'crimson-abyss',
    name: 'Crimson Abyss',
    desc: 'Dramatic velvet noir and ruby heat',
    cssBg: 'bg-[#120508]',
    ambientOrbs: {
      orb1: 'rgba(239, 68, 68, 0.24)',
      orb2: 'rgba(225, 29, 72, 0.2)',
      orb3: 'rgba(168, 85, 247, 0.14)',
    },
    previewGradient: 'from-[#120508] via-[#24080e] to-[#450a0a]',
  },
  'sunset-dusk': {
    id: 'sunset-dusk',
    name: 'Sunset Dusk',
    desc: 'Warm twilight purple and solar amber',
    cssBg: 'bg-[#10061a]',
    ambientOrbs: {
      orb1: 'rgba(245, 158, 11, 0.22)',
      orb2: 'rgba(168, 85, 247, 0.22)',
      orb3: 'rgba(236, 72, 153, 0.16)',
    },
    previewGradient: 'from-[#10061a] via-[#1e0a32] to-[#3b0764]',
  },
  'studio-light': {
    id: 'studio-light',
    name: 'Studio Ceramic',
    desc: 'Crisp modern daylight with subtle tint',
    cssBg: 'bg-slate-100',
    ambientOrbs: {
      orb1: 'rgba(6, 182, 212, 0.12)',
      orb2: 'rgba(245, 158, 11, 0.1)',
      orb3: 'rgba(99, 102, 241, 0.1)',
    },
    previewGradient: 'from-slate-100 via-slate-200 to-slate-100',
  },
  'pure-black': {
    id: 'pure-black',
    name: 'Pure OLED',
    desc: 'Absolute true pitch-black contrast',
    cssBg: 'bg-black',
    ambientOrbs: {
      orb1: 'rgba(6, 182, 212, 0.14)',
      orb2: 'rgba(244, 63, 94, 0.12)',
      orb3: 'rgba(255, 255, 255, 0.06)',
    },
    previewGradient: 'from-black via-zinc-950 to-black',
  },
};

