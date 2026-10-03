import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db, cleanForFirestore, handleFirestoreError, OperationType } from './firebase';
import { MatchRoom } from '../types/user';
import { GameMode, Player, WinningLine } from '../types/game';

// Local BroadcastChannel for instant testing across multiple browser tabs/windows
const channel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('apex_ttt_online_bus')
    : null;

function saveLocalRoom(room: MatchRoom) {
  try {
    localStorage.setItem(`apex_room_${room.id}`, JSON.stringify(room));
    channel?.postMessage({ type: 'ROOM_UPDATE', room });
  } catch {
    // ignore
  }
}

function getLocalRoom(roomId: string): MatchRoom | null {
  try {
    const raw = localStorage.getItem(`apex_room_${roomId}`);
    return raw ? (JSON.parse(raw) as MatchRoom) : null;
  } catch {
    return null;
  }
}

// Helper to generate a 6-digit room code
export function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create an online multiplayer match room
export async function createOnlineRoom(
  hostId: string,
  hostName: string,
  hostAvatar: string | undefined,
  mode: GameMode = 'classic3x3'
): Promise<MatchRoom> {
  const roomId = generateRoomCode();
  const cellCount = mode === 'grid4x4' ? 16 : 9;

  const newRoom: MatchRoom = {
    id: roomId,
    name: `${hostName}'s Arena`,
    mode,
    status: 'waiting',
    hostId,
    hostName,
    hostAvatar: hostAvatar || '⚔️',
    hostMark: 'X',
    guestId: null,
    guestName: null,
    guestAvatar: null,
    guestMark: 'O',
    currentTurn: 'X',
    board: Array(cellCount).fill(null),
    xPieceIndices: [],
    oPieceIndices: [],
    lastMoveIndex: null,
    winner: null,
    winningLine: null,
    rematchRequestedBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveLocalRoom(newRoom);

  // Non-blocking Firestore room creation with clean payload
  const roomDocRef = doc(db, 'rooms', roomId);
  const cleanPayload = cleanForFirestore(newRoom as unknown as Record<string, unknown>);
  setDoc(roomDocRef, cleanPayload).catch((err) => {
    handleFirestoreError(err, OperationType.CREATE, `rooms/${roomId}`);
  });

  return newRoom;
}

// Join an online room by its 6-digit code
export async function joinOnlineRoom(
  roomId: string,
  guestId: string,
  guestName: string,
  guestAvatar: string | undefined
): Promise<MatchRoom> {
  const cleanId = roomId.trim();
  const roomDocRef = doc(db, 'rooms', cleanId);

  let room: MatchRoom | null = null;
  try {
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
    const snap = await Promise.race([getDoc(roomDocRef), timeout]);
    if (snap && snap.exists()) {
      room = snap.data() as MatchRoom;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `rooms/${cleanId}`);
  }

  if (!room) {
    room = getLocalRoom(cleanId);
  }

  if (!room) {
    throw new Error('Room not found. Check the 6-digit code and try again.');
  }

  if (room.status === 'playing' && room.guestId !== guestId) {
    throw new Error('This match room is already full.');
  }
  if (room.status === 'completed' || room.status === 'abandoned') {
    throw new Error('This match has already finished.');
  }
  if (room.hostId === guestId) {
    return room;
  }

  const updates: Partial<MatchRoom> = {
    guestId,
    guestName,
    guestAvatar: guestAvatar || '🔥',
    status: 'playing',
    updatedAt: new Date().toISOString(),
  };

  const updatedRoom = { ...room, ...updates };
  saveLocalRoom(updatedRoom);

  const cleanUpdates = cleanForFirestore(updates as Record<string, unknown>);
  updateDoc(roomDocRef, cleanUpdates).catch(() => {});

  return updatedRoom;
}

// Make a move in an online room
export async function makeOnlineMove(
  roomId: string,
  newBoard: (Player | null)[],
  nextTurn: Player,
  lastMoveIndex: number,
  xPieceIndices?: number[],
  oPieceIndices?: number[],
  winner?: Player | 'draw' | null,
  winningLine?: WinningLine | null
): Promise<void> {
  const roomDocRef = doc(db, 'rooms', roomId);
  const updates: Partial<MatchRoom> = {
    board: newBoard,
    currentTurn: nextTurn,
    lastMoveIndex,
    updatedAt: new Date().toISOString(),
  };

  if (xPieceIndices !== undefined) updates.xPieceIndices = xPieceIndices;
  if (oPieceIndices !== undefined) updates.oPieceIndices = oPieceIndices;
  if (winner !== undefined) {
    updates.winner = winner;
    if (winner !== null) {
      updates.status = 'completed';
    }
  }
  if (winningLine !== undefined) updates.winningLine = winningLine;

  const existing = getLocalRoom(roomId);
  if (existing) {
    saveLocalRoom({ ...existing, ...updates });
  }

  const cleanUpdates = cleanForFirestore(updates as Record<string, unknown>);
  updateDoc(roomDocRef, cleanUpdates).catch((err) => {
    handleFirestoreError(err, OperationType.UPDATE, `rooms/${roomId}`);
  });
}

// Request Rematch
export async function requestOnlineRematch(roomId: string, requesterId: string): Promise<void> {
  const roomDocRef = doc(db, 'rooms', roomId);
  const updates: Partial<MatchRoom> = {
    rematchRequestedBy: requesterId,
    updatedAt: new Date().toISOString(),
  };

  const existing = getLocalRoom(roomId);
  if (existing) {
    saveLocalRoom({ ...existing, ...updates });
  }

  const cleanUpdates = cleanForFirestore(updates as Record<string, unknown>);
  updateDoc(roomDocRef, cleanUpdates).catch(() => {});
}

// Reset match for a rematch
export async function resetOnlineMatch(
  roomId: string,
  mode: GameMode = 'classic3x3'
): Promise<void> {
  const cellCount = mode === 'grid4x4' ? 16 : 9;
  const roomDocRef = doc(db, 'rooms', roomId);

  const updates: Partial<MatchRoom> = {
    status: 'playing',
    currentTurn: 'X',
    board: Array(cellCount).fill(null),
    xPieceIndices: [],
    oPieceIndices: [],
    lastMoveIndex: null,
    winner: null,
    winningLine: null,
    rematchRequestedBy: null,
    updatedAt: new Date().toISOString(),
  };

  const existing = getLocalRoom(roomId);
  if (existing) {
    saveLocalRoom({ ...existing, ...updates });
  }

  const cleanUpdates = cleanForFirestore(updates as Record<string, unknown>);
  updateDoc(roomDocRef, cleanUpdates).catch(() => {});
}

// Leave room
export async function leaveOnlineRoom(roomId: string, userId: string): Promise<void> {
  const roomDocRef = doc(db, 'rooms', roomId);
  const existing = getLocalRoom(roomId);

  if (existing) {
    const isHost = existing.hostId === userId;
    const updates: Partial<MatchRoom> = {
      status: 'abandoned',
      updatedAt: new Date().toISOString(),
    };
    saveLocalRoom({ ...existing, ...updates });

    const cleanUpdates = cleanForFirestore(updates as Record<string, unknown>);
    updateDoc(roomDocRef, cleanUpdates).catch(() => {});
  }
}

// Real-time synchronization subscription
export function subscribeToRoom(
  roomId: string,
  onUpdate: (room: MatchRoom) => void
): () => void {
  const roomDocRef = doc(db, 'rooms', roomId);

  const handleMessage = (e: MessageEvent) => {
    if (e.data?.type === 'ROOM_UPDATE' && e.data.room?.id === roomId) {
      onUpdate(e.data.room);
    }
  };
  channel?.addEventListener('message', handleMessage);

  const handleStorage = (e: StorageEvent) => {
    if (e.key === `apex_room_${roomId}` && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue) as MatchRoom;
        onUpdate(parsed);
      } catch {
        // ignore
      }
    }
  };
  window.addEventListener('storage', handleStorage);

  let unsubFirestore = () => {};
  try {
    unsubFirestore = onSnapshot(
      roomDocRef,
      (snap) => {
        if (snap.exists()) {
          const cloudRoom = snap.data() as MatchRoom;
          saveLocalRoom(cloudRoom);
          onUpdate(cloudRoom);
        } else {
          const fallback = getLocalRoom(roomId);
          if (fallback) onUpdate(fallback);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `rooms/${roomId}`);
        const fallback = getLocalRoom(roomId);
        if (fallback) onUpdate(fallback);
      }
    );
  } catch {
    // Local listener handles fallback
  }

  return () => {
    unsubFirestore();
    channel?.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorage);
  };
}

// Find open public rooms waiting for an opponent
export async function fetchOpenRooms(): Promise<MatchRoom[]> {
  try {
    const roomsRef = collection(db, 'rooms');
    const q = query(roomsRef, where('status', '==', 'waiting'), limit(8));
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
    const snap = await Promise.race([getDocs(q), timeout]);
    if (snap) {
      return snap.docs.map((docSnap) => docSnap.data() as MatchRoom);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'rooms');
  }

  // Return any locally saved waiting rooms
  const localRooms: MatchRoom[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('apex_room_')) {
      try {
        const r = JSON.parse(localStorage.getItem(key) || '') as MatchRoom;
        if (r.status === 'waiting') localRooms.push(r);
      } catch {
        // ignore
      }
    }
  }
  return localRooms;
}
