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
  GameScore,
} from '../types/game';
import { THEMES, BACKGROUND_THEMES } from '../utils/theme';
import { PreviewArena } from './PreviewArena';
import {
  X,
  Palette,
  Clock,
  UserCheck,
  Volume2,
  VolumeX,
  RotateCcw,
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
  BarChart2,
  BookOpen,
  Trophy,
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
  score?: GameScore;
  onResetStats?: () => void;
  onResetRound?: () => void;
  onClose: () => void;
}

type TabKey = 'board' | 'background' | 'themes' | 'stats' | 'rules';

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
  score,
  onResetStats,
  onResetRound,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('board');
  const [isPeeking, setIsPeeking] = useState<boolean>(false);
  const [showMobilePreview, setShowMobilePreview] = useState<boolean>(true);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);
  const [justReset, setJustReset] = useState<boolean>(false);

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
          <span>Exit Peek (Return to Settings)</span>
        </button>
      </div>
    );
  }

  const handleStatsReset = () => {
    if (confirmReset) {
      onResetStats?.();
      setConfirmReset(false);
      setJustReset(true);
      setTimeout(() => setJustReset(false), 2500);
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/40 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-[28px] sm:rounded-[32px] shadow-2xl max-h-[92vh] flex flex-col text-slate-900 dark:text-slate-100 overflow-hidden transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white/95 dark:bg-slate-900/95">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Control Center & Settings
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Configure themes, view battle records, check rules & match preferences
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Color Mode Toggle */}
            <button
              onClick={() => {
                const next: ColorMode = colorMode === 'dark' ? 'light' : colorMode === 'light' ? 'system' : 'dark';
                onSelectColorMode(next);
              }}
              className="p-2 sm:px-2.5 sm:py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 cursor-pointer shadow-sm"
              title={`Theme: ${colorMode.toUpperCase()}`}
            >
              {colorMode === 'light' ? (
                <Sun className="w-3.5 h-3.5 text-amber-500" />
              ) : colorMode === 'dark' ? (
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
              ) : (
                <Laptop className="w-3.5 h-3.5 text-cyan-500" />
              )}
              <span className="hidden lg:inline capitalize font-medium">{colorMode}</span>
            </button>

            {/* Quick Sound Toggle */}
            <button
              onClick={onToggleMute}
              className="p-2 sm:px-2.5 sm:py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 cursor-pointer shadow-sm"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
              )}
              <span className="hidden lg:inline font-medium">{isMuted ? 'Muted' : 'Audio'}</span>
            </button>

            {/* Quick Restart Round */}
            {onResetRound && (
              <button
                onClick={() => {
                  onResetRound();
                }}
                className="p-2 sm:px-2.5 sm:py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Restart Current Match"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                <span className="hidden lg:inline font-medium">Restart</span>
              </button>
            )}

            <button
              onClick={() => setIsPeeking(true)}
              className="px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Hide modal to view full game screen"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
              <span className="hidden md:inline font-medium">Peek</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Interactive Live Preview */}
          <div className="md:w-[320px] lg:w-[350px] shrink-0 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3 sm:p-4 flex flex-col justify-start overflow-y-auto custom-scrollbar">
            {/* Mobile Header with collapse toggle */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                <Eye className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Live Preview Arena</span>
              </div>
              <button
                onClick={() => setShowMobilePreview(!showMobilePreview)}
                className="md:hidden text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-cyan-100 dark:bg-cyan-950/40 border border-cyan-300 dark:border-cyan-800/60"
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
              <div className="mt-2.5 text-[11px] text-slate-600 dark:text-slate-400 bg-white/90 dark:bg-slate-900/70 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/90 leading-relaxed shadow-sm">
                ✨ Click empty cells in the preview to test placing marks. Every selection on the right updates instantly!
              </div>
            </div>
          </div>

          {/* Right Column: Tab Switcher & Full Customization Options */}
          <div className="flex-1 min-h-0 flex flex-col p-4 sm:p-5 overflow-hidden bg-white dark:bg-slate-900">
            {/* Tab Navigation */}
            <div className="grid grid-cols-5 gap-1 p-1 mb-4 bg-slate-100 dark:bg-slate-950/90 rounded-2xl border border-slate-200 dark:border-slate-800 shrink-0">
              <button
                onClick={() => setActiveTab('board')}
                className={`py-2 px-1 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'board'
                    ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-slate-700/80 ring-1 ring-cyan-500/40'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Board</span>
              </button>

              <button
                onClick={() => setActiveTab('background')}
                className={`py-2 px-1 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'background'
                    ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-slate-700/80 ring-1 ring-cyan-500/40'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">FX Canvas</span>
              </button>

              <button
                onClick={() => setActiveTab('themes')}
                className={`py-2 px-1 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'themes'
                    ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-slate-700/80 ring-1 ring-cyan-500/40'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Palette className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Themes</span>
              </button>

              <button
                onClick={() => setActiveTab('stats')}
                className={`py-2 px-1 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'stats'
                    ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-slate-700/80 ring-1 ring-cyan-500/40'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Stats</span>
              </button>

              <button
                onClick={() => setActiveTab('rules')}
                className={`py-2 px-1 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'rules'
                    ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-slate-700/80 ring-1 ring-cyan-500/40'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Rules</span>
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
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                        <span>Board Chassis Style</span>
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Outer frame architecture</span>
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
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative shadow-sm ${
                            boardCustomization.style === style.id
                              ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 text-cyan-900 dark:text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.2)] ring-1 ring-cyan-500'
                              : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{style.title}</span>
                            {boardCustomization.style === style.id && (
                              <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{style.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cell Surface Finish */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Cell Surface Finish</span>
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Tile depth & sheen</span>
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
                          className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer shadow-sm ${
                            boardCustomization.cellFinish === finish.id
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.2)] ring-1 ring-emerald-500'
                              : 'bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="text-xs font-bold text-slate-900 dark:text-white">{finish.label}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{finish.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* X & O Glyph Style */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span>X & O Glyph Render Style</span>
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Mark stroke aesthetic</span>
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
                          className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer shadow-sm ${
                            boardCustomization.markStyle === mark.id
                              ? 'bg-amber-50 dark:bg-yellow-950/40 text-amber-900 dark:text-yellow-300 border-amber-500 shadow-[0_0_12px_rgba(234,179,8,0.2)] ring-1 ring-amber-500'
                              : 'bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="text-xs font-bold text-slate-900 dark:text-white">{mark.label}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{mark.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Board Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() =>
                        onUpdateBoardCustomization({
                          showCoordinates: !boardCustomization.showCoordinates,
                        })
                      }
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer shadow-sm ${
                        boardCustomization.showCoordinates
                          ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 text-cyan-900 dark:text-cyan-200'
                          : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Grid Coordinates</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">A1..C3 matrix guide markers</div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                          boardCustomization.showCoordinates
                            ? 'bg-cyan-500 border-cyan-500 text-white'
                            : 'border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {boardCustomization.showCoordinates && <Check className="w-3 h-3" />}
                      </div>
                    </button>

                    <button
                      onClick={() =>
                        onUpdateBoardCustomization({
                          showTurnGlow: !boardCustomization.showTurnGlow,
                        })
                      }
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer shadow-sm ${
                        boardCustomization.showTurnGlow
                          ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-900 dark:text-purple-200'
                          : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Active Turn Perimeter Glow</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Atmosphere pulses with player color</div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                          boardCustomization.showTurnGlow
                            ? 'bg-purple-500 border-purple-500 text-white'
                            : 'border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {boardCustomization.showTurnGlow && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: BACKGROUND FX CANVAS */}
              {activeTab === 'background' && (
                <div className="space-y-6">
                  {/* Backdrop Color Atmosphere */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                        <span>Background Atmosphere & Palette</span>
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Deep color mood</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {bgThemeList.map((bg) => {
                        const isSelected = backgroundCustomization.bgTheme === bg.id;
                        return (
                          <button
                            key={bg.id}
                            onClick={() => onUpdateBackgroundCustomization({ bgTheme: bg.id })}
                            className={`p-2.5 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer group shadow-sm ${
                              isSelected
                                ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 text-cyan-900 dark:text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.2)] ring-1 ring-cyan-500'
                                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span
                                className="w-4 h-4 rounded-full border border-black/10 dark:border-white/20 shadow-sm"
                                style={{ backgroundColor: bg.ambientOrbs.orb1 }}
                              />
                              {isSelected && <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />}
                            </div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300">
                              {bg.name}
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">{bg.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Canvas Motion Animation Engine */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Dynamic Canvas Animation</span>
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Living motion engine</span>
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
                          className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer shadow-sm ${
                            backgroundCustomization.style === engine.id
                              ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-900 dark:text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.2)] ring-1 ring-purple-500'
                              : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">{engine.title}</div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">{engine.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cursor / Touch Trail */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-rose-500" />
                        <span>Pointer Trail Effect</span>
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Mouse & touch physics</span>
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
                          className={`py-2 px-1 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer shadow-sm ${
                            backgroundCustomization.trail === tr.id
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 border-rose-500 ring-1 ring-rose-500'
                              : 'bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                          }`}
                        >
                          {tr.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Density & Speed */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                        Particle Density
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {(['low', 'medium', 'high'] as ParticleDensity[]).map((d) => (
                          <button
                            key={d}
                            onClick={() => onUpdateBackgroundCustomization({ density: d })}
                            className={`py-2 text-xs font-semibold rounded-xl border capitalize transition-all cursor-pointer shadow-sm ${
                              backgroundCustomization.density === d
                                ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-300 border-cyan-500'
                                : 'bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                        Particle Speed
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {(['slow', 'normal', 'fast'] as ParticleSpeed[]).map((s) => (
                          <button
                            key={s}
                            onClick={() => onUpdateBackgroundCustomization({ speed: s })}
                            className={`py-2 text-xs font-semibold rounded-xl border capitalize transition-all cursor-pointer shadow-sm ${
                              backgroundCustomization.speed === s
                                ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-300 border-cyan-500'
                                : 'bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: COLORS & MATCH RULES */}
              {activeTab === 'themes' && (
                <div className="space-y-6">
                  {/* Appearance Mode */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Appearance Mode
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Bright Light · Midnight Dark · System</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => onSelectColorMode('light')}
                        className={`py-2.5 px-3 rounded-2xl border text-center transition-all flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer shadow-sm ${
                          colorMode === 'light'
                            ? 'bg-amber-50 text-amber-900 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.2)] ring-1 ring-amber-500'
                            : 'bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <Sun className="w-4 h-4 text-amber-500" />
                        <span>Bright</span>
                      </button>
                      <button
                        onClick={() => onSelectColorMode('dark')}
                        className={`py-2.5 px-3 rounded-2xl border text-center transition-all flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer shadow-sm ${
                          colorMode === 'dark'
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-300 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.2)] ring-1 ring-indigo-500'
                            : 'bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <Moon className="w-4 h-4 text-indigo-400" />
                        <span>Dark</span>
                      </button>
                      <button
                        onClick={() => onSelectColorMode('system')}
                        className={`py-2.5 px-3 rounded-2xl border text-center transition-all flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer shadow-sm ${
                          colorMode === 'system'
                            ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-300 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.2)] ring-1 ring-cyan-500'
                            : 'bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <Laptop className="w-4 h-4 text-cyan-500" />
                        <span>System</span>
                      </button>
                    </div>
                  </div>

                  {/* Theme Palette Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Color Schemes ({themeList.length} Styles)
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Reactive X & O lights</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {themeList.map((t) => {
                        const isSelected = currentTheme === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => onSelectTheme(t.id)}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative shadow-sm ${
                              isSelected
                                ? 'bg-cyan-50 dark:bg-slate-800 border-cyan-500 text-cyan-900 dark:text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.2)] ring-1 ring-cyan-500'
                                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">{t.name}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div
                                className="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold font-display shadow-sm"
                                style={{ backgroundColor: `${t.xColor}22`, color: t.xColor }}
                              >
                                ✕
                              </div>
                              <div
                                className="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold font-display shadow-sm"
                                style={{ backgroundColor: `${t.oColor}22`, color: t.oColor }}
                              >
                                ◯
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Blitz Timer */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-rose-500" />
                        <span>Blitz Turn Timer</span>
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Seconds per move</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Casual (Off)', val: null },
                        { label: '15s Rapid', val: 15 },
                        { label: '10s Blitz', val: 10 },
                        { label: '5s Bullet', val: 5 },
                      ].map((item) => (
                        <button
                          key={item.label}
                          onClick={() => onSelectBlitz(item.val)}
                          className={`py-2 px-1 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer shadow-sm ${
                            blitzDuration === item.val
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 border-rose-500 ring-1 ring-rose-500'
                              : 'bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Starting Player Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Starting Turn Rule</span>
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">First move allocation</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Alternate Each Game', val: 'alternate' as const },
                        { label: 'X First (Always)', val: 'X' as const },
                        { label: 'O First (Always)', val: 'O' as const },
                      ].map((item) => (
                        <button
                          key={item.val}
                          onClick={() => onSelectStartingPlayer(item.val)}
                          className={`py-2 px-1 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer shadow-sm ${
                            startingPlayer === item.val
                              ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300 border-purple-500 ring-1 ring-purple-500'
                              : 'bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: STATISTICS & CAREER RECORDS */}
              {activeTab === 'stats' && (
                <div className="space-y-5">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <BarChart2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <span>Battle Statistics & Streaks</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Match outcomes, personal streaks & performance records</p>
                  </div>

                  {score ? (
                    <>
                      {/* Highlight Cards */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
                          <div className="flex items-center justify-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold mb-1">
                            <Flame className="w-3.5 h-3.5" />
                            <span>Current Streak</span>
                          </div>
                          <div className="text-3xl font-display font-bold text-slate-900 dark:text-white tabular-nums">
                            {score.currentStreak}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">Consecutive wins</div>
                        </div>

                        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
                          <div className="flex items-center justify-center gap-1.5 text-xs text-cyan-600 dark:text-cyan-400 font-semibold mb-1">
                            <Trophy className="w-3.5 h-3.5" />
                            <span>Best Streak</span>
                          </div>
                          <div className="text-3xl font-display font-bold text-slate-900 dark:text-white tabular-nums">
                            {score.bestStreak}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">Personal record</div>
                        </div>
                      </div>

                      {/* Detailed Metric Rows */}
                      {(() => {
                        const totalGames = score.playerX + score.playerO + score.draws;
                        const xWinRate = totalGames > 0 ? Math.round((score.playerX / totalGames) * 100) : 0;
                        const oWinRate = totalGames > 0 ? Math.round((score.playerO / totalGames) * 100) : 0;
                        const drawRate = totalGames > 0 ? Math.round((score.draws / totalGames) * 100) : 0;

                        return (
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                              <span className="text-slate-600 dark:text-slate-400">Total Matches Played</span>
                              <span className="font-bold text-slate-900 dark:text-white tabular-nums text-sm">{totalGames}</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                              <span className="text-slate-600 dark:text-slate-400">Player X Victories</span>
                              <span className="font-bold text-cyan-600 dark:text-cyan-400 tabular-nums text-sm">
                                {score.playerX} ({xWinRate}%)
                              </span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                              <span className="text-slate-600 dark:text-slate-400">Player O / Gemini Victories</span>
                              <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums text-sm">
                                {score.playerO} ({oWinRate}%)
                              </span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                              <span className="text-slate-600 dark:text-slate-400">Stalemates / Draws</span>
                              <span className="font-bold text-slate-700 dark:text-slate-300 tabular-nums text-sm">
                                {score.draws} ({drawRate}%)
                              </span>
                            </div>

                            {/* Win Distribution Bar */}
                            {totalGames > 0 && (
                              <div className="pt-2">
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5 flex justify-between">
                                  <span>Victory Distribution</span>
                                  <span>X: {xWinRate}% · Gemini: {oWinRate}% · Draws: {drawRate}%</span>
                                </div>
                                <div className="h-2 rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-800">
                                  <div className="bg-cyan-500 h-full transition-all" style={{ width: `${xWinRate}%` }} />
                                  <div className="bg-rose-500 h-full transition-all" style={{ width: `${oWinRate}%` }} />
                                  <div className="bg-slate-400 dark:bg-slate-600 h-full transition-all" style={{ width: `${drawRate}%` }} />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Reset Stats Action */}
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-300">Reset Match Records</div>
                          <div className="text-[11px] text-slate-500">Reset all wins, losses, and streak counters to zero</div>
                        </div>

                        <button
                          onClick={handleStatsReset}
                          className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                            justReset
                              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/50'
                              : confirmReset
                              ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/60 animate-pulse'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                          }`}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>
                            {justReset
                              ? 'Stats Cleared! ✓'
                              : confirmReset
                              ? 'Click Again to Confirm'
                              : 'Reset Stats'}
                          </span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-6 text-center text-slate-500 text-xs">
                      No match records available yet. Play a game to record scores!
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: HOW TO PLAY & RULES */}
              {activeTab === 'rules' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <span>Game Rules & Guidelines</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Master all 3 game modes and control shortcuts</p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div className="text-xs font-bold text-cyan-600 dark:text-cyan-300 flex items-center gap-1.5 mb-1">
                        <span>1. Classic 3×3</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        The timeless strategy game. Align 3 of your marks horizontally, vertically, or diagonally before your opponent to claim victory.
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div className="text-xs font-bold text-purple-600 dark:text-purple-300 flex items-center gap-1.5 mb-1">
                        <span>2. Infinite 3-Piece (No Draws)</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Each player can only have 3 active marks on the board. When you place your 4th mark, your oldest placed mark automatically vanishes! Draws are impossible — you must plan dynamic cycles.
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
                        <span>3. 4×4 Grid (Connect 4)</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Expanded 16-cell battleground. Requires 4 consecutive marks in a straight horizontal, vertical, or diagonal line to win.
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div className="text-xs font-bold text-blue-600 dark:text-blue-300 flex items-center gap-1.5 mb-1">
                        <span>4. 6×6 Grid (Grand Battleground)</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Massive 36-cell tactical arena! Connect 4 consecutive marks in any row, column, or diagonal line to win. Master open-ended lines, traps, and multiple threats.
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div className="text-xs font-bold text-amber-600 dark:text-amber-300 flex items-center gap-1.5 mb-1.5">
                        <span>Keyboard Shortcuts</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                          <span>Place Move</span>
                          <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-slate-800 dark:text-slate-200 text-[10px]">1 – 9 / Numpad</kbd>
                        </div>
                        <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                          <span>Restart Match</span>
                          <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-slate-800 dark:text-slate-200 text-[10px]">R</kbd>
                        </div>
                        <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                          <span>Coach Hint</span>
                          <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-slate-800 dark:text-slate-200 text-[10px]">H</kbd>
                        </div>
                        <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                          <span>Toggle Audio</span>
                          <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-slate-800 dark:text-slate-200 text-[10px]">M</kbd>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-900/95">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            All adjustments update live & save automatically
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-lg cursor-pointer active:scale-95"
          >
            Apply & Done
          </button>
        </div>
      </div>
    </div>
  );
};
