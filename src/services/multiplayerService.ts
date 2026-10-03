import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  collection,
  query,
  where,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { MatchRoom } from '../types/user';
import { GameMode, Player, WinningLine } from '../types/game';

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

  const roomDocRef = doc(db, 'rooms', roomId);
  try {
    await setDoc(roomDocRef, newRoom);
    return newRoom;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `rooms/${roomId}`);
    throw error;
  }
}

// Join an online room by its 6-digit code
export async function joinOnlineRoom(
  roomId: string,
  guestId: string,
  guestName: string,
  guestAvatar: string | undefined
): Promise<MatchRoom> {
  const roomDocRef = doc(db, 'rooms', roomId.trim());
  try {
    const snap = await getDoc(roomDocRef);
    if (!snap.exists()) {
      throw new Error('Room not found. Check the 6-digit code and try again.');
    }

    const room = snap.data() as MatchRoom;
    if (room.status === 'playing' && room.guestId !== guestId) {
      throw new Error('This match room is already full.');
    }
    if (room.status === 'completed' || room.status === 'abandoned') {
      throw new Error('This match has already finished.');
    }
    if (room.hostId === guestId) {
      return room; // Host re-entering their own room
    }

    const updates: Partial<MatchRoom> = {
      guestId,
      guestName,
      guestAvatar: guestAvatar || '🔥',
      status: 'playing',
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(roomDocRef, updates);
    return { ...room, ...updates };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
    throw error;
  }
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

  if (xPieceIndices) updates.xPieceIndices = xPieceIndices;
  if (oPieceIndices) updates.oPieceIndices = oPieceIndices;

  if (winner !== undefined) {
    updates.winner = winner;
    if (winner !== null) {
      updates.status = 'completed';
    }
  }

  if (winningLine !== undefined) {
    updates.winningLine = winningLine;
  }

  try {
    await updateDoc(roomDocRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
    throw error;
  }
}

// Restart / Rematch
export async function resetOnlineMatch(roomId: string, mode: GameMode): Promise<void> {
  const roomDocRef = doc(db, 'rooms', roomId);
  const cellCount = mode === 'grid4x4' ? 16 : 9;

  try {
    await updateDoc(roomDocRef, {
      board: Array(cellCount).fill(null),
      currentTurn: 'X',
      status: 'playing',
      lastMoveIndex: null,
      winner: null,
      winningLine: null,
      xPieceIndices: [],
      oPieceIndices: [],
      rematchRequestedBy: null,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// Leave / Abandon Room
export async function leaveOnlineRoom(roomId: string, uid: string): Promise<void> {
  const roomDocRef = doc(db, 'rooms', roomId);
  try {
    const snap = await getDoc(roomDocRef);
    if (!snap.exists()) return;
    const room = snap.data() as MatchRoom;

    if (room.hostId === uid) {
      // Host left, mark abandoned
      await updateDoc(roomDocRef, { status: 'abandoned', updatedAt: new Date().toISOString() });
    } else if (room.guestId === uid) {
      // Guest left
      await updateDoc(roomDocRef, {
        guestId: null,
        guestName: null,
        status: 'waiting',
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// Listen to room updates in real-time
export function subscribeToRoom(
  roomId: string,
  onUpdate: (room: MatchRoom | null) => void
): () => void {
  const roomDocRef = doc(db, 'rooms', roomId);
  return onSnapshot(
    roomDocRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as MatchRoom);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `rooms/${roomId}`);
    }
  );
}

// Find open public rooms waiting for an opponent
export async function fetchOpenRooms(): Promise<MatchRoom[]> {
  try {
    const roomsRef = collection(db, 'rooms');
    const q = query(roomsRef, where('status', '==', 'waiting'), limit(8));
    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => docSnap.data() as MatchRoom);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'rooms');
    return [];
  }
}
