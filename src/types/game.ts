export type SoundPackId = 'cyberpunk' | 'retro-arcade' | 'zen-minimalist' | 'quantum-scifi';

export interface SoundPackConfig {
  id: SoundPackId;
  name: string;
  tagline: string;
  icon: string;
  description: string;
  badge: string;
  vibeGradient: string;
  previewNote: string;
}

export type Player = 'X' | 'O';
export type CellValue = Player | null;

export type GameMode = 'classic3x3' | 'infinite3' | 'grid6x6';
export type OpponentType = 'bot' | 'pvp' | 'online';
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

export interface ModeScores {
  bot: GameScore;
  pvp: GameScore;
  online: GameScore;
}

export type PaletteVibe = 'neon' | 'minimalist';

export interface CustomPalette {
  id: string;
  name: string;
  vibe: PaletteVibe;
  xColor: string;
  xGlow: string;
  oColor: string;
  oGlow: string;
  gridBorder: string;
  cellBg?: string;
  accentBg?: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  avatar: string; // avatar key or URL
  photoURL?: string | null; // Custom uploaded user picture (data URL or web URL)
  bio?: string; // User bio and details
  website?: string; // External portfolio, social or website link
  title?: string; // e.g. 'Tactician', 'Grandmaster'
  email?: string | null;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  bestStreak: number;
  customPalettes?: CustomPalette[];
  activePaletteId?: string | null;
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderPhotoURL?: string | null;
  text: string;
  timestamp: number;
}

export interface OnlineRoom {
  id: string;
  mode: GameMode;
  status: 'waiting' | 'playing' | 'completed' | 'abandoned';
  hostId: string;
  hostName: string;
  hostAvatar: string;
  hostPhotoURL?: string | null;
  hostMark: Player;
  guestId?: string | null;
  guestName?: string | null;
  guestAvatar?: string | null;
  guestPhotoURL?: string | null;
  guestMark?: Player | null;
  currentTurn: Player;
  board: (Player | null)[];
  xPieceIndices?: number[];
  oPieceIndices?: number[];
  winner?: Player | 'draw' | null;
  winningLine?: WinningLine | null;
  lastMoveIndex?: number | null;
  lastEmote?: {
    senderId: string;
    senderName: string;
    emoji: string;
    timestamp: number;
  } | null;
  messages?: ChatMessage[];
  rematchRequestedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ColorMode = 'light' | 'dark' | 'system';

export type ThemeId =
  | 'cyber-neon'
  | 'sunset-amber'
  | 'emerald-blade'
  | 'monochrome'
  | 'cosmic-gold'
  | 'synthwave-retro'
  | 'crimson-shadow'
  | string;

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
  vibe?: PaletteVibe;
  isCustom?: boolean;
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
