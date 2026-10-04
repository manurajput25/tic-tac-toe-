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

// Local + Multi-Tab Relay Channel for resilient multiplayer
const RELAY_CHANNEL_NAME = 'apex_online_multiplayer_channel';
let relayChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    relayChannel = new BroadcastChannel(RELAY_CHANNEL_NAME);
  }
} catch {
  // ignore
}

function broadcastRoomUpdate(room: OnlineRoom) {
  try {
    localStorage.setItem(`apex_room_${room.id}`, JSON.stringify(room));
    const openRoomsRaw = localStorage.getItem('apex_local_open_rooms');
    let openRooms: OnlineRoom[] = openRoomsRaw ? JSON.parse(openRoomsRaw) : [];
    if (room.status === 'waiting') {
      openRooms = [room, ...openRooms.filter((r) => r.id !== room.id)].slice(0, 20);
    } else {
      openRooms = openRooms.filter((r) => r.id !== room.id);
    }
    localStorage.setItem('apex_local_open_rooms', JSON.stringify(openRooms));

    relayChannel?.postMessage({ type: 'ROOM_UPDATE', room });
  } catch {
    // ignore
  }
}

function getLocalRoom(roomId: string): OnlineRoom | null {
  try {
    const raw = localStorage.getItem(`apex_room_${roomId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
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

  const cellCount =
    mode === 'grid12x12' ? 144 : mode === 'grid6x6' ? 36 : mode === 'grid4x4' ? 16 : 9;

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
    messages: [],
    rematchRequestedBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Immediately store in local relay registry for zero-delay host setup
  broadcastRoomUpdate(newRoom);

  // Sync to Firestore with timeout fallback
  try {
    const firestorePromise = setDoc(doc(db, 'rooms', roomId), newRoom);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), 4000)
    );
    await Promise.race([firestorePromise, timeoutPromise]);
  } catch (error) {
    console.warn('Firestore room sync fallback to relay channel:', error);
  }

  return newRoom;
}

export async function joinOnlineRoom(
  roomId: string,
  guestProfile: UserProfile
): Promise<OnlineRoom> {
  const cleanId = roomId.trim().toUpperCase();
  let roomData: OnlineRoom | null = null;

  // Try fetching from Firestore with timeout
  try {
    const roomRef = doc(db, 'rooms', cleanId);
    const snapPromise = getDoc(roomRef);
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500));
    const snap = await Promise.race([snapPromise, timeoutPromise]);
    if (snap && snap.exists()) {
      roomData = snap.data() as OnlineRoom;
    }
  } catch (err) {
    console.warn('Firestore get room failed, checking relay:', err);
  }

  // Fallback to local / relay storage
  if (!roomData) {
    roomData = getLocalRoom(cleanId);
  }

  if (!roomData) {
    throw new Error(`Match room "${cleanId}" not found. Verify the code.`);
  }

  // Check if host is returning
  if (roomData.hostId === guestProfile.uid) {
    return roomData;
  }

  if (roomData.guestId && roomData.guestId !== guestProfile.uid) {
    throw new Error(`Match room "${cleanId}" is already full.`);
  }

  const updatedRoom: OnlineRoom = {
    ...roomData,
    guestId: guestProfile.uid,
    guestName: guestProfile.displayName,
    guestAvatar: guestProfile.avatar,
    guestMark: 'O',
    status: 'playing',
    updatedAt: new Date().toISOString(),
  };

  broadcastRoomUpdate(updatedRoom);

  // Update in Firestore asynchronously
  try {
    const roomRef = doc(db, 'rooms', cleanId);
    await updateDoc(roomRef, {
      guestId: guestProfile.uid,
      guestName: guestProfile.displayName,
      guestAvatar: guestProfile.avatar,
      guestMark: 'O',
      status: 'playing',
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Firestore updateDoc failed, relay active:', err);
  }

  return updatedRoom;
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
  const current = getLocalRoom(roomId);
  const updatedRoom: OnlineRoom = {
    ...(current || ({} as OnlineRoom)),
    id: roomId,
    board: nextBoard,
    currentTurn: nextTurn,
    lastMoveIndex: lastIndex,
    xPieceIndices: nextXPieces || [],
    oPieceIndices: nextOPieces || [],
    winner: winner !== undefined ? winner : null,
    winningLine: winningLine || null,
    status: winner ? 'completed' : 'playing',
    updatedAt: new Date().toISOString(),
  } as OnlineRoom;

  broadcastRoomUpdate(updatedRoom);

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
  } catch (err) {
    console.warn('Firestore submit move failed, relay updated:', err);
  }
}

export async function sendOnlineEmote(
  roomId: string,
  senderId: string,
  senderName: string,
  emoji: string
): Promise<void> {
  const current = getLocalRoom(roomId);
  if (current) {
    const updatedRoom: OnlineRoom = {
      ...current,
      lastEmote: {
        senderId,
        senderName,
        emoji,
        timestamp: Date.now(),
      },
      updatedAt: new Date().toISOString(),
    };
    broadcastRoomUpdate(updatedRoom);
  }

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
  } catch (err) {
    console.warn('Firestore emote update failed, relay active:', err);
  }
}

export async function sendRoomChatMessage(
  roomId: string,
  senderId: string,
  senderName: string,
  senderAvatar: string,
  text: string
): Promise<void> {
  const trimmed = text.trim().slice(0, 150);
  if (!trimmed) return;

  const current = getLocalRoom(roomId);
  const currentMessages = current?.messages || [];

  const newMsg = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    senderId,
    senderName,
    senderAvatar,
    text: trimmed,
    timestamp: Date.now(),
  };

  const updatedMessages = [...currentMessages.slice(-49), newMsg];
  if (current) {
    const updatedRoom: OnlineRoom = {
      ...current,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    };
    broadcastRoomUpdate(updatedRoom);
  }

  try {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Firestore chat update failed, relay active:', err);
  }
}

export async function requestOnlineRematch(
  roomId: string,
  requesterId: string,
  cellCount: number
): Promise<void> {
  const current = getLocalRoom(roomId);
  let updatedRoom: OnlineRoom | null = null;

  if (current) {
    if (current.rematchRequestedBy && current.rematchRequestedBy !== requesterId) {
      updatedRoom = {
        ...current,
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
      };
    } else {
      updatedRoom = {
        ...current,
        rematchRequestedBy: requesterId,
        updatedAt: new Date().toISOString(),
      };
    }
    broadcastRoomUpdate(updatedRoom);
  }

  try {
    const roomRef = doc(db, 'rooms', roomId);
    if (updatedRoom) {
      await updateDoc(roomRef, {
        ...(updatedRoom.rematchRequestedBy === null
          ? {
              board: Array(cellCount).fill(null),
              currentTurn: 'X',
              winner: null,
              winningLine: null,
              lastMoveIndex: null,
              xPieceIndices: [],
              oPieceIndices: [],
              status: 'playing',
              rematchRequestedBy: null,
            }
          : { rematchRequestedBy: requesterId }),
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn('Firestore rematch request failed, relay active:', err);
  }
}

export function subscribeToOnlineRoom(
  roomId: string,
  onUpdate: (room: OnlineRoom) => void,
  onError?: (err: Error) => void
): () => void {
  let isUnsubscribed = false;

  const initialLocal = getLocalRoom(roomId);
  if (initialLocal) {
    onUpdate(initialLocal);
  }

  const handleRelay = (e: MessageEvent) => {
    if (isUnsubscribed) return;
    if (e.data?.type === 'ROOM_UPDATE' && e.data?.room?.id === roomId) {
      onUpdate(e.data.room);
    }
  };
  relayChannel?.addEventListener('message', handleRelay);

  const handleStorage = (e: StorageEvent) => {
    if (isUnsubscribed) return;
    if (e.key === `apex_room_${roomId}` && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        onUpdate(parsed);
      } catch {
        // ignore
      }
    }
  };
  window.addEventListener('storage', handleStorage);

  let unsubFirestore: (() => void) | undefined;
  try {
    unsubFirestore = onSnapshot(
      doc(db, 'rooms', roomId),
      (snap) => {
        if (isUnsubscribed) return;
        if (snap.exists()) {
          const room = snap.data() as OnlineRoom;
          broadcastRoomUpdate(room);
          onUpdate(room);
        }
      },
      (error) => {
        console.warn(`Firestore listener warning for room ${roomId}:`, error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('Firestore onSnapshot init failed:', err);
  }

  return () => {
    isUnsubscribed = true;
    relayChannel?.removeEventListener('message', handleRelay);
    window.removeEventListener('storage', handleStorage);
    if (unsubFirestore) unsubFirestore();
  };
}

export function subscribeToOpenRooms(
  onUpdate: (rooms: OnlineRoom[]) => void,
  onError?: (err: Error) => void
): () => void {
  let isUnsubscribed = false;

  const refreshOpenRooms = (cloudRooms: OnlineRoom[] = []) => {
    const rawLocal = localStorage.getItem('apex_local_open_rooms');
    const localRooms: OnlineRoom[] = rawLocal ? JSON.parse(rawLocal) : [];
    const map = new Map<string, OnlineRoom>();
    [...localRooms, ...cloudRooms].forEach((r) => {
      if (r && r.status === 'waiting') {
        map.set(r.id, r);
      }
    });
    onUpdate(Array.from(map.values()));
  };

  refreshOpenRooms([]);

  const handleRelay = (e: MessageEvent) => {
    if (isUnsubscribed) return;
    if (e.data?.type === 'ROOM_UPDATE') {
      refreshOpenRooms();
    }
  };
  relayChannel?.addEventListener('message', handleRelay);

  const handleStorage = (e: StorageEvent) => {
    if (isUnsubscribed) return;
    if (e.key === 'apex_local_open_rooms') {
      refreshOpenRooms();
    }
  };
  window.addEventListener('storage', handleStorage);

  let unsubFirestore: (() => void) | undefined;
  try {
    const q = query(
      collection(db, 'rooms'),
      where('status', '==', 'waiting'),
      limit(12)
    );
    unsubFirestore = onSnapshot(
      q,
      (snap) => {
        if (isUnsubscribed) return;
        const rooms: OnlineRoom[] = [];
        snap.forEach((doc) => rooms.push(doc.data() as OnlineRoom));
        refreshOpenRooms(rooms);
      },
      (error) => {
        console.warn('Firestore open rooms query warning:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('Firestore open rooms init failed:', err);
  }

  return () => {
    isUnsubscribed = true;
    relayChannel?.removeEventListener('message', handleRelay);
    window.removeEventListener('storage', handleStorage);
    if (unsubFirestore) unsubFirestore();
  };
}
