import React, { useState } from 'react';
import { CustomPalette, PaletteVibe, UserProfile } from '../types/game';
import { sound } from '../utils/audio';
import {
  Palette,
  Sparkles,
  X,
  Check,
  Trash2,
  Plus,
  Zap,
  Sliders,
  Eye,
  CheckCircle2,
} from 'lucide-react';

interface PaletteBuilderModalProps {
  userProfile: UserProfile;
  onSavePalette: (palette: CustomPalette) => Promise<void>;
  onDeletePalette: (paletteId: string) => Promise<void>;
  onSelectPalette: (palette: CustomPalette | null) => void;
  activePaletteId?: string | null;
  onClose: () => void;
}

// Curated starter presets for quick inspiration
const TEMPLATE_PRESETS: Omit<CustomPalette, 'id' | 'createdAt'>[] = [
  {
    name: 'Cyberpunk Tokyo',
    vibe: 'neon',
    xColor: '#00f0ff',
    xGlow: 'rgba(0, 240, 255, 0.75)',
    oColor: '#ff007f',
    oGlow: 'rgba(255, 0, 127, 0.75)',
    gridBorder: '#00f0ff',
    cellBg: 'rgba(15, 23, 42, 0.9)',
    accentBg: 'from-cyan-950/40 via-slate-900/60 to-pink-950/40',
  },
  {
    name: 'Nordic Minimalist',
    vibe: 'minimalist',
    xColor: '#f8fafc',
    xGlow: 'transparent',
    oColor: '#94a3b8',
    oGlow: 'transparent',
    gridBorder: '#475569',
    cellBg: 'rgba(30, 41, 59, 0.8)',
    accentBg: 'from-slate-950 via-slate-900 to-slate-950',
  },
  {
    name: 'Acid Viper',
    vibe: 'neon',
    xColor: '#a3e635',
    xGlow: 'rgba(163, 230, 53, 0.75)',
    oColor: '#e879f9',
    oGlow: 'rgba(232, 121, 249, 0.75)',
    gridBorder: '#a3e635',
    cellBg: 'rgba(12, 18, 28, 0.95)',
    accentBg: 'from-lime-950/40 via-slate-900/60 to-fuchsia-950/40',
  },
  {
    name: 'Monochrome Luxe',
    vibe: 'minimalist',
    xColor: '#ffffff',
    xGlow: 'transparent',
    oColor: '#64748b',
    oGlow: 'transparent',
    gridBorder: '#334155',
    cellBg: 'rgba(15, 23, 42, 0.95)',
    accentBg: 'from-zinc-950 via-slate-950 to-zinc-950',
  },
  {
    name: 'Solar Flare',
    vibe: 'neon',
    xColor: '#fbbf24',
    xGlow: 'rgba(251, 191, 36, 0.75)',
    oColor: '#38bdf8',
    oGlow: 'rgba(56, 189, 248, 0.75)',
    gridBorder: '#f59e0b',
    cellBg: 'rgba(26, 16, 8, 0.9)',
    accentBg: 'from-amber-950/40 via-slate-900/60 to-sky-950/40',
  },
];

const QUICK_COLORS = [
  '#00f0ff', // Electric Cyan
  '#ff007f', // Neon Magenta
  '#a3e635', // Acid Lime
  '#fbbf24', // Amber Gold
  '#a855f7', // Vivid Purple
  '#f43f5e', // Hot Crimson
  '#38bdf8', // Sky Blue
  '#ffffff', // Pure White
  '#94a3b8', // Slate Gray
  '#10b981', // Emerald
];

export const PaletteBuilderModal: React.FC<PaletteBuilderModalProps> = ({
  userProfile,
  onSavePalette,
  onDeletePalette,
  onSelectPalette,
  activePaletteId,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'saved'>('create');
  const [name, setName] = useState<string>('My Custom Arena');
  const [vibe, setVibe] = useState<PaletteVibe>('neon');
  const [xColor, setXColor] = useState<string>('#00f0ff');
  const [oColor, setOColor] = useState<string>('#ff007f');
  const [gridBorder, setGridBorder] = useState<string>('#00f0ff');
  const [cellBg, setCellBg] = useState<string>('rgba(15, 23, 42, 0.85)');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  const savedPalettes = userProfile.customPalettes || [];

  const handleApplyTemplate = (tpl: typeof TEMPLATE_PRESETS[0]) => {
    sound.playClick();
    setName(tpl.name);
    setVibe(tpl.vibe);
    setXColor(tpl.xColor);
    setOColor(tpl.oColor);
    setGridBorder(tpl.gridBorder);
    if (tpl.cellBg) setCellBg(tpl.cellBg);
  };

  const handleSaveAndApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    sound.playClick();

    const isNeon = vibe === 'neon';
    const newPalette: CustomPalette = {
      id: `pal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim().slice(0, 24),
      vibe,
      xColor,
      xGlow: isNeon ? `${xColor}bb` : 'transparent',
      oColor,
      oGlow: isNeon ? `${oColor}bb` : 'transparent',
      gridBorder,
      cellBg,
      accentBg: isNeon
        ? `from-[${xColor}20] via-slate-900/60 to-[${oColor}20]`
        : 'from-slate-950 via-slate-900 to-slate-950',
      createdAt: new Date().toISOString(),
    };

    try {
      await onSavePalette(newPalette);
      onSelectPalette(newPalette);
      setSavedSuccessMsg(`"${newPalette.name}" saved and applied!`);
      setTimeout(() => {
        setSavedSuccessMsg(null);
        onClose();
      }, 1200);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Custom Palette Studio"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="relative w-full max-w-xl my-auto p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl text-slate-900 dark:text-slate-100 overflow-hidden">
        {/* Ambient Top Glow */}
        <div
          className="absolute inset-x-8 top-0 h-px transition-all duration-300 pointer-events-none"
          style={{
            background: `linear-gradient(to right, transparent, ${xColor}, ${oColor}, transparent)`,
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-sm"
              style={{
                backgroundColor: `${xColor}20`,
                color: xColor,
                border: `1px solid ${xColor}40`,
              }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  Palette Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                  Custom Colors
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Design & persist custom Neon or Minimalist themes to your profile
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl mb-4 border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('create');
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'create'
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Create & Design</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('saved');
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'saved'
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Saved Palettes ({savedPalettes.length})</span>
          </button>
        </div>

        {activeTab === 'create' ? (
          <form onSubmit={handleSaveAndApply} className="space-y-4">
            {/* Quick Templates Bar */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Quick Preset Inspirations
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {TEMPLATE_PRESETS.map((tpl) => (
                  <button
                    key={tpl.name}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-cyan-500 text-[11px] font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap active:scale-95 transition-all cursor-pointer"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: tpl.xColor }}
                    />
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: tpl.oColor }}
                    />
                    <span>{tpl.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Interactive Board Preview */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center">
              <div className="absolute top-2 left-3 flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest pointer-events-none">
                <Eye className="w-3 h-3 text-cyan-400" />
                <span>Live Arena Preview ({vibe})</span>
              </div>

              {/* 3x3 Mock Preview Grid */}
              <div
                className="mt-4 p-2 rounded-2xl transition-all duration-300"
                style={{
                  backgroundColor: cellBg,
                  border: `2px solid ${gridBorder}`,
                  boxShadow:
                    vibe === 'neon'
                      ? `0 0 25px ${gridBorder}33`
                      : '0 10px 25px rgba(0,0,0,0.5)',
                }}
              >
                <div className="grid grid-cols-3 gap-1.5 w-36 h-36">
                  {/* Row 1 */}
                  <div
                    className="rounded-lg flex items-center justify-center text-xl font-black font-display"
                    style={{
                      border: `1px solid ${gridBorder}40`,
                      color: xColor,
                      textShadow:
                        vibe === 'neon'
                          ? `0 0 10px ${xColor}, 0 0 20px ${xColor}`
                          : 'none',
                    }}
                  >
                    ✕
                  </div>
                  <div
                    className="rounded-lg flex items-center justify-center text-xl font-black font-display"
                    style={{
                      border: `1px solid ${gridBorder}40`,
                      color: oColor,
                      textShadow:
                        vibe === 'neon'
                          ? `0 0 10px ${oColor}, 0 0 20px ${oColor}`
                          : 'none',
                    }}
                  >
                    ◯
                  </div>
                  <div
                    className="rounded-lg flex items-center justify-center"
                    style={{ border: `1px solid ${gridBorder}40` }}
                  />

                  {/* Row 2 */}
                  <div
                    className="rounded-lg flex items-center justify-center text-xl font-black font-display"
                    style={{
                      border: `1px solid ${gridBorder}40`,
                      color: oColor,
                      textShadow:
                        vibe === 'neon'
                          ? `0 0 10px ${oColor}, 0 0 20px ${oColor}`
                          : 'none',
                    }}
                  >
                    ◯
                  </div>
                  <div
                    className="rounded-lg flex items-center justify-center text-xl font-black font-display"
                    style={{
                      border: `1px solid ${gridBorder}40`,
                      color: xColor,
                      textShadow:
                        vibe === 'neon'
                          ? `0 0 10px ${xColor}, 0 0 20px ${xColor}`
                          : 'none',
                    }}
                  >
                    ✕
                  </div>
                  <div
                    className="rounded-lg flex items-center justify-center text-xl font-black font-display"
                    style={{
                      border: `1px solid ${gridBorder}40`,
                      color: oColor,
                      textShadow:
                        vibe === 'neon'
                          ? `0 0 10px ${oColor}, 0 0 20px ${oColor}`
                          : 'none',
                    }}
                  >
                    ◯
                  </div>

                  {/* Row 3 */}
                  <div
                    className="rounded-lg flex items-center justify-center"
                    style={{ border: `1px solid ${gridBorder}40` }}
                  />
                  <div
                    className="rounded-lg flex items-center justify-center"
                    style={{ border: `1px solid ${gridBorder}40` }}
                  />
                  <div
                    className="rounded-lg flex items-center justify-center text-xl font-black font-display"
                    style={{
                      border: `1px solid ${gridBorder}40`,
                      color: xColor,
                      textShadow:
                        vibe === 'neon'
                          ? `0 0 10px ${xColor}, 0 0 20px ${xColor}`
                          : 'none',
                    }}
                  >
                    ✕
                  </div>
                </div>
              </div>
            </div>

            {/* Vibe Selection: Neon vs Minimalist */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Style Archetype
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setVibe('neon');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    vibe === 'neon'
                      ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-cyan-600 dark:text-cyan-400">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Neon Glow</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    High-voltage electric glows, radiant strike lasers & vivid pulses.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setVibe('minimalist');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    vibe === 'minimalist'
                      ? 'border-slate-400 bg-slate-200/50 dark:bg-slate-800/80 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-white">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Minimalist Clean</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Zero-glare matte finishes, architectural grid lines & pure focus.
                  </p>
                </button>
              </div>
            </div>

            {/* Color Customizers (X Color, O Color, Grid Border) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Piece X Color */}
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Piece X Color
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={xColor}
                      onChange={(e) => setXColor(e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      {xColor}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {QUICK_COLORS.slice(0, 5).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setXColor(c)}
                      className="w-5 h-5 rounded-lg border border-black/20 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Piece O Color */}
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Piece O Color
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={oColor}
                      onChange={(e) => setOColor(e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      {oColor}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {QUICK_COLORS.slice(5, 10).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setOColor(c)}
                      className="w-5 h-5 rounded-lg border border-black/20 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Grid / Border Accent Color */}
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Grid Accent
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={gridBorder}
                      onChange={(e) => setGridBorder(e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      {gridBorder}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {['#00f0ff', '#f59e0b', '#10b981', '#475569', '#ffffff'].map(
                    (c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setGridBorder(c)}
                        className="w-5 h-5 rounded-lg border border-black/20 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                        style={{ backgroundColor: c }}
                      />
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Palette Name Input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                Palette Name
              </label>
              <input
                type="text"
                required
                maxLength={24}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Cyber Matrix Horizon"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900 dark:text-white font-medium"
              />
            </div>

            {savedSuccessMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{savedSuccessMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !name.trim()}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
              >
                {isSaving ? 'Persisting to Profile...' : 'Save & Apply to Game'}
              </button>
            </div>
          </form>
        ) : (
          /* Saved Palettes Tab */
          <div className="space-y-3">
            {savedPalettes.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Palette className="w-10 h-10 mx-auto text-slate-500 mb-2 opacity-60" />
                <p className="text-xs font-bold text-slate-300">
                  No custom palettes created yet
                </p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                  Switch to the "Create & Design" tab above to create your own
                  Neon or Minimalist color palettes!
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold shadow cursor-pointer"
                >
                  Create First Palette
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {savedPalettes.map((palette) => {
                  const isActive = activePaletteId === palette.id;
                  return (
                    <div
                      key={palette.id}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                        isActive
                          ? 'bg-cyan-500/10 border-cyan-500/50 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1 p-1 rounded-lg bg-black/40 border border-white/10">
                          <span
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: palette.xColor }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: palette.oColor }}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {palette.name}
                            </span>
                            <span
                              className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full ${
                                palette.vibe === 'neon'
                                  ? 'bg-cyan-500/20 text-cyan-400'
                                  : 'bg-slate-500/20 text-slate-300'
                              }`}
                            >
                              {palette.vibe}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            Saved on {new Date(palette.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            onSelectPalette(palette);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-emerald-500 text-slate-950 shadow-sm'
                              : 'bg-slate-200 dark:bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {isActive ? 'Active' : 'Apply'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            onDeletePalette(palette.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Delete palette"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
