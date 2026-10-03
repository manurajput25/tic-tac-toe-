export type Player = 'X' | 'O';
export type CellValue = Player | null;

export type GameMode = 'classic3x3' | 'infinite3' | 'grid4x4';
export type OpponentType = 'bot' | 'pvp';
export type BotDifficulty = 'easy' | 'medium' | 'unbeatable';

export interface MoveRecord {
  index: number;
  player: Player;
  timestamp: number;
  removedIndex?: number; // In infinite3 mode, which index got removed
}

export interface WinningLine {
  indices: number[];
  direction: 'horizontal' | 'vertical' | 'diagonal-main' | 'diagonal-anti';
  rowOrCol?: number;
}

export type GameStatus = 'playing' | 'won' | 'draw';

export interface GameScore {
  playerX: number;
  playerO: number;
  draws: number;
  currentStreak: number;
  bestStreak: number;
}

export type ColorMode = 'light' | 'dark' | 'system';

export type ThemeId =
  | 'cyber-neon'
  | 'sunset-amber'
  | 'emerald-blade'
  | 'monochrome'
  | 'cosmic-gold'
  | 'synthwave-retro'
  | 'crimson-shadow';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  xColor: string;
  xGlow: string;
  oColor: string;
  oGlow: string;
  accentBg: string;
  gridBorder: string;
  cellBg: string;
  cellHover: string;
}

export interface InfinitePiece {
  index: number;
  player: Player;
  order: number; // 1, 2, or 3 (3 is about to disappear when next placed)
}

// Board Customization Types
export type BoardStyle = 'glass-stadium' | 'cyber-matrix' | 'minimal-clean' | 'tactile-wood';
export type CellFinish = 'frosted-glass' | 'deep-gloss' | 'matte-stealth';
export type MarkStyle = 'neon-glow' | 'technical-hollow' | 'bold-solid';

export interface BoardCustomization {
  style: BoardStyle;
  cellFinish: CellFinish;
  markStyle: MarkStyle;
  showCoordinates: boolean;
  showTurnGlow: boolean;
}

// Background Customization Types
export type BackgroundThemeId =
  | 'deep-space'
  | 'midnight-navy'
  | 'cyber-chamber'
  | 'crimson-abyss'
  | 'sunset-dusk'
  | 'studio-light'
  | 'pure-black';

export type BackgroundStyle =
  | 'constellation'
  | 'warp-speed'
  | 'aurora-waves'
  | 'cyber-grid'
  | 'minimal-mesh';

export type ParticleDensity = 'low' | 'medium' | 'high';
export type ParticleSpeed = 'slow' | 'normal' | 'fast';
export type TrailStyle = 'stardust' | 'comet-ribbon' | 'pulse-ripple' | 'none';

export interface BackgroundCustomization {
  bgTheme: BackgroundThemeId;
  style: BackgroundStyle;
  density: ParticleDensity;
  speed: ParticleSpeed;
  trail: TrailStyle;
  showGlowOrbs: boolean;
}
