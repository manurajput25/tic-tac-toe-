import React, { useState } from 'react';
import {
  ThemeId,
  ColorMode,
  BoardCustomization,
  BackgroundCustomization,
  BoardStyle,
  CellFinish,
  MarkStyle,
  BackgroundThemeId,
  BackgroundStyle,
  ParticleDensity,
  ParticleSpeed,
  TrailStyle,
} from '../types/game';
import { THEMES, BACKGROUND_THEMES } from '../utils/theme';
import { PreviewArena } from './PreviewArena';
import {
  X,
  Palette,
  Clock,
  UserCheck,
  Volume2,
  Check,
  Sun,
  Moon,
  Laptop,
  LayoutGrid,
  Sparkles,
  Sliders,
  Shield,
  Layers,
  Flame,
  Zap,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface GameSettingsModalProps {
  currentTheme: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
  colorMode: ColorMode;
  onSelectColorMode: (mode: ColorMode) => void;
  blitzDuration: number | null;
  onSelectBlitz: (seconds: number | null) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  startingPlayer: 'X' | 'O' | 'alternate';
  onSelectStartingPlayer: (starter: 'X' | 'O' | 'alternate') => void;
  boardCustomization: BoardCustomization;
  onUpdateBoardCustomization: (updates: Partial<BoardCustomization>) => void;
  backgroundCustomization: BackgroundCustomization;
  onUpdateBackgroundCustomization: (updates: Partial<BackgroundCustomization>) => void;
  onClose: () => void;
}

type TabKey = 'board' | 'background' | 'themes';

export const GameSettingsModal: React.FC<GameSettingsModalProps> = ({
  currentTheme,
  onSelectTheme,
  colorMode,
  onSelectColorMode,
  blitzDuration,
  onSelectBlitz,
  isMuted,
  onToggleMute,
  startingPlayer,
  onSelectStartingPlayer,
  boardCustomization,
  onUpdateBoardCustomization,
  backgroundCustomization,
  onUpdateBackgroundCustomization,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('board');
  const [isPeeking, setIsPeeking] = useState<boolean>(false);
  const [showMobilePreview, setShowMobilePreview] = useState<boolean>(true);

  const themeList = Object.values(THEMES);
  const bgThemeList = Object.values(BACKGROUND_THEMES);
  const activeThemeConfig = THEMES[currentTheme] || THEMES['cyber-neon'];

  // Temporary fullscreen peek mode
  if (isPeeking) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => setIsPeeking(false)}
          className="px-6 py-3 bg-slate-900/95 text-white font-bold text-xs rounded-2xl border border-cyan-500/80 shadow-2xl backdrop-blur-xl flex items-center gap-2 hover:bg-slate-800 transition-all cursor-pointer animate-bounce"
        >
          <EyeOff className="w-4 h-4 text-cyan-400" />
          <span>Exit Peek (Return to Customizer)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-[28px] sm:rounded-[32px] shadow-2xl max-h-[92vh] flex flex-col text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 shrink-0 bg-slate-900/95">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-white tracking-tight">
                Arena Workshop & Customization
              </h3>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Configure board styles, canvas engines, backdrop themes & match preferences
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPeeking(true)}
              className="px-2.5 py-1.5 text-xs text-slate-300 hover:text-cyan-300 hover:bg-slate-800 rounded-xl transition-all border border-slate-800 flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Hide modal to view full game screen"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline font-medium">Peek Fullscreen</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area: Side-by-Side on Desktop, Stacked & Scrollable on Mobile */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Interactive Live Preview (Sticky on desktop, toggleable on mobile) */}
          <div className="md:w-[320px] lg:w-[350px] shrink-0 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/50 p-3 sm:p-4 flex flex-col justify-start overflow-y-auto custom-scrollbar">
            {/* Mobile Header with collapse toggle */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 uppercase tracking-wider">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live Preview Arena</span>
              </div>
              <button
                onClick={() => setShowMobilePreview(!showMobilePreview)}
                className="md:hidden text-[11px] text-cyan-400 font-semibold flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-cyan-950/40 border border-cyan-800/60"
              >
                {showMobilePreview ? 'Hide Preview' : 'Show Preview'}
                {showMobilePreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Preview Box */}
            <div className={`${showMobilePreview ? 'block' : 'hidden md:block'}`}>
              <PreviewArena
                theme={activeThemeConfig}
                boardCustomization={boardCustomization}
                backgroundCustomization={backgroundCustomization}
                isDark={colorMode === 'dark' || colorMode === 'system'}
              />
              <div className="mt-2.5 text-[11px] text-slate-400 bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/90 leading-relaxed">
                ✨ Click empty cells in the preview to test placing marks. Every selection on the right updates instantly!
              </div>
            </div>
          </div>

          {/* Right Column: Tab Switcher & Full Customization Options */}
          <div className="flex-1 min-h-0 flex flex-col p-4 sm:p-5 overflow-hidden">
            {/* Tab Navigation */}
            <div className="grid grid-cols-3 gap-1.5 p-1 mb-4 bg-slate-950/90 rounded-2xl border border-slate-800 shrink-0">
              <button
                onClick={() => setActiveTab('board')}
                className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'board'
                    ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/80 ring-1 ring-cyan-400/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Board Arena</span>
              </button>

              <button
                onClick={() => setActiveTab('background')}
                className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'background'
                    ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/80 ring-1 ring-cyan-400/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Background FX</span>
              </button>

              <button
                onClick={() => setActiveTab('themes')}
                className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'themes'
                    ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/80 ring-1 ring-cyan-400/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Colors & Rules</span>
              </button>
            </div>

            {/* Scrollable Customization Controls */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 sm:pr-2 space-y-6 custom-scrollbar">
              {/* TAB 1: BOARD ARENA CUSTOMIZATION */}
              {activeTab === 'board' && (
                <div className="space-y-6">
                  {/* Board Chassis Architecture */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Board Chassis Style</span>
                      </span>
                      <span className="text-[11px] text-slate-400">Outer frame architecture</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        {
                          id: 'glass-stadium' as BoardStyle,
                          title: 'Glass Stadium',
                          desc: 'Chamfered obsidian glass with top bevel reflection',
                        },
                        {
                          id: 'cyber-matrix' as BoardStyle,
                          title: 'Cyber Matrix',
                          desc: 'Corner laser brackets with glowing sci-fi chassis',
                        },
                        {
                          id: 'minimal-clean' as BoardStyle,
                          title: 'Minimal Clean',
                          desc: 'Floating borderless architectural tiles',
                        },
                        {
                          id: 'tactile-wood' as BoardStyle,
                          title: 'Tactile Wood',
                          desc: 'Dark acoustic walnut with rich warm trim',
                        },
                      ].map((style) => (
                        <button
                          key={style.id}
                          onClick={() => onUpdateBoardCustomization({ style: style.id })}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                            boardCustomization.style === style.id
                              ? 'bg-cyan-950/40 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/60'
                              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-white">{style.title}</span>
                            {boardCustomization.style === style.id && (
                              <Check className="w-3.5 h-3.5 text-cyan-400" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug">{style.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cell Surface Finish */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Cell Surface Finish</span>
                      </span>
                      <span className="text-[11px] text-slate-400">Tile depth & sheen</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'frosted-glass' as CellFinish, label: 'Frosted Glass', desc: 'Diffuse inner glow' },
                        { id: 'deep-gloss' as CellFinish, label: 'Deep Gloss', desc: 'Specular sheen' },
                        { id: 'matte-stealth' as CellFinish, label: 'Matte Stealth', desc: 'Carbon finish' },
                      ].map((finish) => (
                        <button
                          key={finish.id}
                          onClick={() => onUpdateBoardCustomization({ cellFinish: finish.id })}
                          className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                            boardCustomization.cellFinish === finish.id
                              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/50'
                              : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800/50 hover:text-slate-200'
                          }`}
                        >
                          <div className="text-xs font-bold text-white">{finish.label}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{finish.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* X & O Glyph Style */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-yellow-400" />
                        <span>X & O Glyph Render Style</span>
                      </span>
                      <span className="text-[11px] text-slate-400">Mark stroke aesthetic</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {
                          id: 'neon-glow' as MarkStyle,
                          label: 'Neon Glow',
                          desc: 'Laser blooms',
                        },
                        {
                          id: 'technical-hollow' as MarkStyle,
                          label: 'Technical Blueprint',
                          desc: 'Dual-rail track',
                        },
                        {
                          id: 'bold-solid' as MarkStyle,
                          label: 'Bold Solid',
                          desc: 'Heavy weight',
                        },
                      ].map((mark) => (
                        <button
                          key={mark.id}
                          onClick={() => onUpdateBoardCustomization({ markStyle: mark.id })}
                          className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                            boardCustomization.markStyle === mark.id
                              ? 'bg-yellow-950/40 text-yellow-300 border-yellow-500/80 shadow-[0_0_12px_rgba(234,179,8,0.25)] ring-1 ring-yellow-500/50'
                              : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800/50 hover:text-slate-200'
                          }`}
                        >
                          <div className="text-xs font-bold text-white">{mark.label}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{mark.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Board Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                    <button
                      onClick={() =>
                        onUpdateBoardCustomization({
                          showCoordinates: !boardCustomization.showCoordinates,
                        })
                      }
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        boardCustomization.showCoordinates
                          ? 'bg-cyan-950/30 border-cyan-700/60 text-cyan-300 ring-1 ring-cyan-500/30'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-white">Grid Coordinates (A-C, 1-3)</div>
                        <div className="text-[10px] text-slate-400">Outer alphanumeric markers</div>
                      </div>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                        {boardCustomization.showCoordinates ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    <button
                      onClick={() =>
                        onUpdateBoardCustomization({
                          showTurnGlow: !boardCustomization.showTurnGlow,
                        })
                      }
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        boardCustomization.showTurnGlow
                          ? 'bg-cyan-950/30 border-cyan-700/60 text-cyan-300 ring-1 ring-cyan-500/30'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-white">Ambient Turn Halo</div>
                        <div className="text-[10px] text-slate-400">Backdrop bloom follows player</div>
                      </div>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                        {boardCustomization.showTurnGlow ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: BACKGROUND FX CUSTOMIZATION */}
              {activeTab === 'background' && (
                <div className="space-y-6">
                  {/* Background Backdrop Mood Presets */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Background Backdrop Mood</span>
                      </span>
                      <span className="text-[11px] text-slate-400">Atmospheric color theme</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {bgThemeList.map((bg) => {
                        const isSelected = backgroundCustomization.bgTheme === bg.id;
                        return (
                          <button
                            key={bg.id}
                            onClick={() => onUpdateBackgroundCustomization({ bgTheme: bg.id })}
                            className={`p-2.5 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer group ${
                              isSelected
                                ? 'bg-cyan-950/40 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/60'
                                : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span
                                className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                                style={{ backgroundColor: bg.ambientOrbs.orb1 }}
                              />
                              {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                            </div>
                            <div className="text-xs font-bold text-white group-hover:text-cyan-300">
                              {bg.name}
                            </div>
                            <p className="text-[10px] text-slate-400 leading-snug mt-0.5">{bg.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Canvas Motion Animation Engine */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>Dynamic Canvas Animation</span>
                      </span>
                      <span className="text-[11px] text-slate-400">Living motion engine</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        {
                          id: 'constellation' as BackgroundStyle,
                          title: 'Star Constellation',
                          desc: 'Interactive nodes with vector links',
                        },
                        {
                          id: 'warp-speed' as BackgroundStyle,
                          title: 'Warp Speed 3D',
                          desc: 'Forward streaming star streaks',
                        },
                        {
                          id: 'aurora-waves' as BackgroundStyle,
                          title: 'Aurora Waves',
                          desc: 'Fluid undulating chromatic ribbons',
                        },
                        {
                          id: 'cyber-grid' as BackgroundStyle,
                          title: 'Cyber Grid 3D',
                          desc: 'Horizon rolling floor wireframe',
                        },
                        {
                          id: 'minimal-mesh' as BackgroundStyle,
                          title: 'Zen Dust',
                          desc: 'Subtle drifting micro-particles',
                        },
                      ].map((engine) => (
                        <button
                          key={engine.id}
                          onClick={() => onUpdateBackgroundCustomization({ style: engine.id })}
                          className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                            backgroundCustomization.style === engine.id
                              ? 'bg-purple-950/40 border-purple-500/80 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.25)] ring-1 ring-purple-500/60'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="text-xs font-bold text-white mb-0.5">{engine.title}</div>
                          <p className="text-[10px] text-slate-400 leading-snug">{engine.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cursor / Touch Trail */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-rose-400" />
                        <span>Pointer Trail Effect</span>
                      </span>
                      <span className="text-[11px] text-slate-400">Mouse & touch physics</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'stardust' as TrailStyle, label: 'Star Dust' },
                        { id: 'comet-ribbon' as TrailStyle, label: 'Comet Tail' },
                        { id: 'pulse-ripple' as TrailStyle, label: 'Shockwave' },
                        { id: 'none' as TrailStyle, label: 'Disabled' },
                      ].map((tr) => (
                        <button
                          key={tr.id}
                          onClick={() => onUpdateBackgroundCustomization({ trail: tr.id })}
                          className={`py-2 px-1 text-xs font-semibold rounded-2xl border text-center transition-all cursor-pointer ${
                            backgroundCustomization.trail === tr.id
                              ? 'bg-rose-950/40 text-rose-300 border-rose-500/80 shadow-[0_0_10px_rgba(244,63,94,0.2)] ring-1 ring-rose-500/50'
                              : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800/50 hover:text-slate-200'
                          }`}
                        >
                          {tr.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Density & Speed */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Density */}
                    <div>
                      <div className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                        Particle Density
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['low', 'medium', 'high'] as ParticleDensity[]).map((d) => (
                          <button
                            key={d}
                            onClick={() => onUpdateBackgroundCustomization({ density: d })}
                            className={`py-2 text-xs font-semibold rounded-xl border capitalize transition-all cursor-pointer ${
                              backgroundCustomization.density === d
                                ? 'bg-cyan-950/40 text-cyan-300 border-cyan-500/80 shadow-sm'
                                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800/50 hover:text-slate-200'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Speed */}
                    <div>
                      <div className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                        Atmosphere Speed
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['slow', 'normal', 'fast'] as ParticleSpeed[]).map((s) => (
                          <button
                            key={s}
                            onClick={() => onUpdateBackgroundCustomization({ speed: s })}
                            className={`py-2 text-xs font-semibold rounded-xl border capitalize transition-all cursor-pointer ${
                              backgroundCustomization.speed === s
                                ? 'bg-cyan-950/40 text-cyan-300 border-cyan-500/80 shadow-sm'
                                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800/50 hover:text-slate-200'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Ambient Glow Orbs Toggle */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-200 font-semibold">
                        Ambient Radial Glow Orbs
                      </div>
                      <div className="text-[11px] text-slate-400">Soft diffused color mesh in background</div>
                    </div>
                    <button
                      onClick={() =>
                        onUpdateBackgroundCustomization({
                          showGlowOrbs: !backgroundCustomization.showGlowOrbs,
                        })
                      }
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                        backgroundCustomization.showGlowOrbs
                          ? 'bg-purple-950/40 text-purple-300 border-purple-800/60 ring-1 ring-purple-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {backgroundCustomization.showGlowOrbs ? 'Enabled' : 'Hidden'}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: COLORS & MATCH RULES */}
              {activeTab === 'themes' && (
                <div className="space-y-6">
                  {/* Appearance Mode */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Appearance Mode
                      </span>
                      <span className="text-[11px] text-slate-400">Light · Dark · System Sync</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => onSelectColorMode('light')}
                        className={`py-2.5 px-3 rounded-2xl border text-center transition-all flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer ${
                          colorMode === 'light'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                            : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800/60 hover:text-slate-200'
                        }`}
                      >
                        <Sun className="w-4 h-4 text-amber-400" />
                        <span>Light</span>
                      </button>
                      <button
                        onClick={() => onSelectColorMode('dark')}
                        className={`py-2.5 px-3 rounded-2xl border text-center transition-all flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer ${
                          colorMode === 'dark'
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/80 shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                            : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800/60 hover:text-slate-200'
                        }`}
                      >
                        <Moon className="w-4 h-4 text-indigo-400" />
                        <span>Dark</span>
                      </button>
                      <button
                        onClick={() => onSelectColorMode('system')}
                        className={`py-2.5 px-3 rounded-2xl border text-center transition-all flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer ${
                          colorMode === 'system'
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/80 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                            : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800/60 hover:text-slate-200'
                        }`}
                      >
                        <Laptop className="w-4 h-4 text-cyan-400" />
                        <span>System</span>
                      </button>
                    </div>
                  </div>

                  {/* Theme Palette Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Color Schemes ({themeList.length} Styles)
                      </span>
                      <span className="text-[11px] text-slate-400">Reactive X & O lights</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {themeList.map((t) => {
                        const isSelected = currentTheme === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => onSelectTheme(t.id)}
                            className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                              isSelected
                                ? 'bg-cyan-950/40 border-cyan-400/90 shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/60'
                                : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-4 h-4 rounded-full inline-block shadow-sm"
                                  style={{
                                    backgroundColor: t.xColor,
                                    boxShadow: `0 0 8px ${t.xGlow}`,
                                  }}
                                />
                                <span
                                  className="w-4 h-4 rounded-full inline-block shadow-sm"
                                  style={{
                                    backgroundColor: t.oColor,
                                    boxShadow: `0 0 8px ${t.oGlow}`,
                                  }}
                                />
                              </div>
                              {isSelected && (
                                <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">
                                  <Check className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-semibold text-slate-100 group-hover:text-white">
                              {t.name}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Match Rules & Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Blitz Timer */}
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Blitz Turn Timer</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { label: 'Off', val: null },
                          { label: '5s', val: 5 },
                          { label: '10s', val: 10 },
                          { label: '15s', val: 15 },
                        ].map((item) => (
                          <button
                            key={item.label}
                            onClick={() => onSelectBlitz(item.val)}
                            className={`py-2 px-1 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                              blitzDuration === item.val
                                ? 'bg-amber-950/40 text-amber-300 border-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.2)] ring-1 ring-amber-500/40'
                                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800/60 hover:text-slate-200'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Starting Player */}
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                        <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                        <span>First Starter</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { label: 'Alternate', val: 'alternate' as const },
                          { label: 'X First', val: 'X' as const },
                          { label: 'O First', val: 'O' as const },
                        ].map((item) => (
                          <button
                            key={item.val}
                            onClick={() => onSelectStartingPlayer(item.val)}
                            className={`py-2 px-1 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                              startingPlayer === item.val
                                ? 'bg-purple-950/40 text-purple-300 border-purple-500/80 shadow-[0_0_10px_rgba(168,85,247,0.2)] ring-1 ring-purple-500/40'
                                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800/60 hover:text-slate-200'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Sound Toggle */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                      <Volume2 className="w-4 h-4 text-cyan-400" />
                      <span>Synthesizer Audio Effects</span>
                    </div>
                    <button
                      onClick={onToggleMute}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                        !isMuted
                          ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {!isMuted ? 'Enabled' : 'Muted'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/95">
          <span className="text-[11px] text-slate-400">
            All adjustments update live & save automatically
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white text-slate-950 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors shadow-lg cursor-pointer active:scale-95"
          >
            Apply & Done
          </button>
        </div>
      </div>
    </div>
  );
};
