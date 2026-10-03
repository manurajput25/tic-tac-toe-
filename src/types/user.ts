import { Player, GameMode, WinningLine } from './game';

export interface UserProfile {
  uid: string;
  username: string; // e.g. "CyberViper"
  displayName: string; // e.g. "Manu Kirar"
  playerId: string; // e.g. "APEX-8392"
  photoURL?: string;
  avatarKey?: string; // preset avatar identifier
  email?: string | null;
  phoneNumber?: string | null;
  stats: {
    wins: number;
    losses: number;
    draws: number;
    bestStreak: number;
    currentStreak: number;
    totalGames: number;
  };
  createdAt: string;
  updatedAt: string;
}

export type RoomStatus = 'waiting' | 'playing' | 'completed' | 'abandoned';

export interface MatchRoom {
  id: string; // 6-digit code or generated ID
  name: string;
  mode: GameMode;
  status: RoomStatus;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  hostMark: Player;
  guestId?: string | null;
  guestName?: string | null;
  guestAvatar?: string | null;
  guestMark?: Player | null;
  currentTurn: Player;
  board: (Player | null)[];
  xPieceIndices?: number[];
  oPieceIndices?: number[];
  lastMoveIndex?: number | null;
  winner?: Player | 'draw' | null;
  winningLine?: WinningLine | null;
  rematchRequestedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const PRESET_AVATARS = [
  { id: 'cyber-ninja', name: 'Cyber Ninja', icon: '⚔️', bg: 'from-cyan-500 to-blue-600' },
  { id: 'neon-phoenix', name: 'Neon Phoenix', icon: '🔥', bg: 'from-amber-500 to-rose-600' },
  { id: 'quantum-glitch', name: 'Quantum Glitch', icon: '⚡', bg: 'from-purple-500 to-indigo-600' },
  { id: 'emerald-dragon', name: 'Emerald Dragon', icon: '🐉', bg: 'from-emerald-500 to-teal-600' },
  { id: 'stellar-cosmonaut', name: 'Stellar Pilot', icon: '🚀', bg: 'from-sky-500 to-indigo-600' },
  { id: 'golden-sentinel', name: 'Golden Titan', icon: '👑', bg: 'from-yellow-400 to-amber-600' },
];
