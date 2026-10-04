import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  query,
  where,
  limit,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, OnlineRoom, Player, GameMode, WinningLine, CustomPalette } from '../types/game';

// Initialize Firebase App & Firestore
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection per Firebase Skill guidelines
export async function testFirebaseConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, check connection.');
    }
  }
}

// Preset Avatars for gamer profile creation
export interface AvatarPreset {
  id: string;
  name: string;
  emoji: string;
  gradient: string;
  accent: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'cyber-ninja', name: 'Cyber Ninja', emoji: '🥷', gradient: 'from-cyan-500 to-blue-600', accent: '#06b6d4' },
  { id: 'solar-phoenix', name: 'Solar Phoenix', emoji: '🔥', gradient: 'from-amber-500 to-rose-600', accent: '#f59e0b' },
  { id: 'quantum-glitch', name: 'Quantum Core', emoji: '⚡', gradient: 'from-purple-500 to-indigo-600', accent: '#a855f7' },
  { id: 'tactical-pilot', name: 'Mech Pilot', emoji: '🤖', gradient: 'from-emerald-500 to-teal-600', accent: '#10b981' },
  { id: 'cosmic-star', name: 'Cosmic Ace', emoji: '👑', gradient: 'from-yellow-400 to-amber-600', accent: '#fbbf24' },
  { id: 'shadow-tiger', name: 'Neon Tiger', emoji: '🐯', gradient: 'from-rose-500 to-orange-500', accent: '#f43f5e' },
  { id: 'abyss-kraken', name: 'Void Phantom', emoji: '👾', gradient: 'from-violet-600 to-fuchsia-600', accent: '#d946ef' },
  { id: 'zen-master', name: 'Aura Master', emoji: '🧘', gradient: 'from-teal-400 to-emerald-600', accent: '#14b8a6' },
];

const LOCAL_PROFILE_KEY = 'apex_ttt_user_profile_v1';

export function getCachedProfile(): UserProfile | null {
  try {
    const saved = localStorage.getItem(LOCAL_PROFILE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function cacheProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

// Ensure there is always a valid local gamer profile immediately available
export function getOrCreateLocalProfile(): UserProfile {
  const cached = getCachedProfile();
  if (cached) return cached;

  const defaultProfile: UserProfile = {
    uid: `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    displayName: 'Apex Player',
    username: `apex_${Math.floor(1000 + Math.random() * 9000)}`,
    avatar: 'cyber-ninja',
    title: 'Arena Tactician',
    email: null,
    totalGames: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    bestStreak: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  cacheProfile(defaultProfile);
  return defaultProfile;
}

// Authenticate user (Anonymous or Google)
export async function ensureAuthenticatedUser(): Promise<User | null> {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          resolve(cred.user);
        } catch {
          // If anonymous sign-in is disabled in project, resolve null gracefully
          resolve(null);
        }
      }
    });
  });
}

export async function loginWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const res = await signInWithPopup(auth, provider);
  return res.user;
}

// User Profile Firestore Operations
export async function fetchProfileFromFirestore(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function saveProfileToFirestore(profile: UserProfile): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    await setDoc(doc(db, 'users', profile.uid), {
      ...profile,
      updatedAt: new Date().toISOString(),
    });
    cacheProfile(profile);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Custom Palette Profile Operations
export async function saveCustomPaletteToProfile(
  profile: UserProfile,
  palette: CustomPalette
): Promise<UserProfile> {
  const existing = profile.customPalettes || [];
  const index = existing.findIndex((p) => p.id === palette.id);
  let updatedPalettes: CustomPalette[];
  if (index !== -1) {
    updatedPalettes = existing.map((p) => (p.id === palette.id ? palette : p));
  } else {
    updatedPalettes = [...existing, palette];
  }

  const updatedProfile: UserProfile = {
    ...profile,
    customPalettes: updatedPalettes,
    activePaletteId: palette.id,
    updatedAt: new Date().toISOString(),
  };

  cacheProfile(updatedProfile);
  await saveProfileToFirestore(updatedProfile).catch(() => {});
  return updatedProfile;
}

export async function deleteCustomPaletteFromProfile(
  profile: UserProfile,
  paletteId: string
): Promise<UserProfile> {
  const existing = profile.customPalettes || [];
  const updatedPalettes = existing.filter((p) => p.id !== paletteId);
  const updatedProfile: UserProfile = {
    ...profile,
    customPalettes: updatedPalettes,
    activePaletteId: profile.activePaletteId === paletteId ? null : profile.activePaletteId,
    updatedAt: new Date().toISOString(),
  };

  cacheProfile(updatedProfile);
  await saveProfileToFirestore(updatedProfile).catch(() => {});
  return updatedProfile;
}

export async function setActivePaletteInProfile(
  profile: UserProfile,
  paletteId: string | null
): Promise<UserProfile> {
  const updatedProfile: UserProfile = {
    ...profile,
    activePaletteId: paletteId,
    updatedAt: new Date().toISOString(),
  };

  cacheProfile(updatedProfile);
  await saveProfileToFirestore(updatedProfile).catch(() => {});
  return updatedProfile;
}

// Generate human-friendly 6-character room code
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Room operations
export async function createOnlineRoom(
  mode: GameMode,
  hostProfile: UserProfile,
  customCode?: string
): Promise<OnlineRoom> {
  const roomId = (customCode || generateRoomCode()).toUpperCase();
  const path = `rooms/${roomId}`;

  const cellCount = mode === 'grid6x6' ? 36 : mode === 'grid4x4' ? 16 : 9;

  const newRoom: OnlineRoom = {
    id: roomId,
    mode,
    status: 'waiting',
    hostId: hostProfile.uid,
    hostName: hostProfile.displayName,
    hostAvatar: hostProfile.avatar,
    hostMark: 'X',
    guestId: null,
    guestName: null,
    guestAvatar: null,
    guestMark: 'O',
    currentTurn: 'X',
    board: Array(cellCount).fill(null),
    xPieceIndices: [],
    oPieceIndices: [],
    winner: null,
    winningLine: null,
    lastMoveIndex: null,
    rematchRequestedBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'rooms', roomId), newRoom);
    return newRoom;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function joinOnlineRoom(
  roomId: string,
  guestProfile: UserProfile
): Promise<OnlineRoom> {
  const cleanId = roomId.trim().toUpperCase();
  const path = `rooms/${cleanId}`;

  try {
    const roomRef = doc(db, 'rooms', cleanId);
    const snap = await getDoc(roomRef);

    if (!snap.exists()) {
      throw new Error(`Match room "${cleanId}" not found. Verify the code.`);
    }

    const roomData = snap.data() as OnlineRoom;

    // Check if already in the room
    if (roomData.hostId === guestProfile.uid) {
      return roomData; // Host returning
    }

    if (roomData.guestId && roomData.guestId !== guestProfile.uid) {
      throw new Error(`Match room "${cleanId}" is already full.`);
    }

    // Join room
    await updateDoc(roomRef, {
      guestId: guestProfile.uid,
      guestName: guestProfile.displayName,
      guestAvatar: guestProfile.avatar,
      guestMark: 'O',
      status: 'playing',
      updatedAt: new Date().toISOString(),
    });

    return {
      ...roomData,
      guestId: guestProfile.uid,
      guestName: guestProfile.displayName,
      guestAvatar: guestProfile.avatar,
      guestMark: 'O',
      status: 'playing',
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

export async function submitOnlineMove(
  roomId: string,
  nextBoard: (Player | null)[],
  nextTurn: Player,
  lastIndex: number,
  nextXPieces?: number[],
  nextOPieces?: number[],
  winner?: Player | 'draw' | null,
  winningLine?: WinningLine | null
): Promise<void> {
  const path = `rooms/${roomId}`;
  try {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      board: nextBoard,
      currentTurn: nextTurn,
      lastMoveIndex: lastIndex,
      xPieceIndices: nextXPieces || [],
      oPieceIndices: nextOPieces || [],
      winner: winner !== undefined ? winner : null,
      winningLine: winningLine || null,
      status: winner ? 'completed' : 'playing',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function sendOnlineEmote(
  roomId: string,
  senderId: string,
  senderName: string,
  emoji: string
): Promise<void> {
  const path = `rooms/${roomId}`;
  try {
    await updateDoc(doc(db, 'rooms', roomId), {
      lastEmote: {
        senderId,
        senderName,
        emoji,
        timestamp: Date.now(),
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function sendRoomChatMessage(
  roomId: string,
  senderId: string,
  senderName: string,
  senderAvatar: string,
  text: string
): Promise<void> {
  const path = `rooms/${roomId}`;
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;

    const data = snap.data() as OnlineRoom;
    const currentMessages = data.messages || [];

    const newMsg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId,
      senderName,
      senderAvatar,
      text: text.trim().slice(0, 150),
      timestamp: Date.now(),
    };

    // Keep up to 40 recent messages
    const updatedMessages = [...currentMessages.slice(-39), newMsg];

    await updateDoc(roomRef, {
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Failed to send chat message:', error);
  }
}

export async function requestOnlineRematch(
  roomId: string,
  requesterId: string,
  cellCount: number
): Promise<void> {
  const path = `rooms/${roomId}`;
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;

    const data = snap.data() as OnlineRoom;

    // If opponent already requested rematch or first requester clicks again
    if (data.rematchRequestedBy && data.rematchRequestedBy !== requesterId) {
      // Both agreed! Reset board and start fresh game
      await updateDoc(roomRef, {
        board: Array(cellCount).fill(null),
        currentTurn: 'X',
        winner: null,
        winningLine: null,
        lastMoveIndex: null,
        xPieceIndices: [],
        oPieceIndices: [],
        status: 'playing',
        rematchRequestedBy: null,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Signal rematch request to opponent
      await updateDoc(roomRef, {
        rematchRequestedBy: requesterId,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeToOnlineRoom(
  roomId: string,
  onUpdate: (room: OnlineRoom) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `rooms/${roomId}`;
  return onSnapshot(
    doc(db, 'rooms', roomId),
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as OnlineRoom);
      }
    },
    (error) => {
      console.warn(`Firestore Error listening to room ${path}:`, error);
      if (onError) onError(error);
    }
  );
}

export function subscribeToOpenRooms(
  onUpdate: (rooms: OnlineRoom[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const q = query(
      collection(db, 'rooms'),
      where('status', '==', 'waiting'),
      limit(12)
    );

    return onSnapshot(
      q,
      (snap) => {
        const rooms: OnlineRoom[] = [];
        snap.forEach((doc) => rooms.push(doc.data() as OnlineRoom));
        onUpdate(rooms);
      },
      (error) => {
        console.warn('Firestore Error listing open rooms:', error);
        if (onError) onError(error);
      }
    );
  } catch (err: unknown) {
    console.warn('Failed to query open rooms:', err);
    return () => {};
  }
}
