import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE = path.resolve(__dirname, '.rooms-cache.json');

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
}

interface OnlineRoom {
  id: string;
  mode: string;
  status: 'waiting' | 'playing' | 'completed' | 'abandoned';
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  hostMark: 'X';
  guestId?: string | null;
  guestName?: string | null;
  guestAvatar?: string | null;
  guestMark?: 'O' | null;
  currentTurn: 'X' | 'O';
  board: (string | null)[];
  xPieceIndices?: number[];
  oPieceIndices?: number[];
  winner?: string | null;
  winningLine?: unknown | null;
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

// In-memory room store with persistent disk backup
const rooms = new Map<string, OnlineRoom>();

function loadRoomsFromDisk() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
      const list = JSON.parse(raw) as OnlineRoom[];
      for (const r of list) {
        if (r && r.id) {
          rooms.set(r.id.toUpperCase(), r);
        }
      }
      console.log(`Loaded ${rooms.size} cached rooms from disk`);
    }
  } catch (err) {
    console.warn('Could not load cached rooms:', err);
  }
}

function saveRoomsToDisk() {
  try {
    const list = Array.from(rooms.values()).slice(-200);
    fs.writeFileSync(CACHE_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save rooms to disk:', err);
  }
}

// Load persisted rooms immediately
loadRoomsFromDisk();

// SSE (Server-Sent Events) listeners by room ID
const roomClients = new Map<string, Set<Response>>();

function broadcastRoom(room: OnlineRoom) {
  saveRoomsToDisk();
  const clients = roomClients.get(room.id);
  if (clients && clients.size > 0) {
    const data = `data: ${JSON.stringify(room)}\n\n`;
    for (const res of clients) {
      try {
        res.write(data);
      } catch {
        clients.delete(res);
      }
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '2mb' }));

  // API Routes: List open waiting rooms
  app.get('/api/rooms', (req: Request, res: Response) => {
    const openRooms: OnlineRoom[] = [];
    for (const room of rooms.values()) {
      if (room.status === 'waiting') {
        openRooms.push(room);
      }
    }
    // Newest first, limit 20
    openRooms.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ rooms: openRooms.slice(0, 20) });
  });

  // API Routes: Get specific room
  app.get('/api/rooms/:id', (req: Request, res: Response) => {
    const roomId = String(req.params.id || '').trim().toUpperCase();
    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ error: `Room ${roomId} not found` });
    }
    res.json({ room });
  });

  // API Routes: Create or register a room
  app.post('/api/rooms', (req: Request, res: Response) => {
    const newRoom = req.body as OnlineRoom;
    if (!newRoom || !newRoom.id) {
      return res.status(400).json({ error: 'Invalid room payload' });
    }
    const cleanId = newRoom.id.trim().toUpperCase();
    newRoom.id = cleanId;
    newRoom.updatedAt = new Date().toISOString();
    rooms.set(cleanId, newRoom);
    broadcastRoom(newRoom);
    res.json({ room: newRoom });
  });

  // API Routes: Join a room
  app.post('/api/rooms/:id/join', (req: Request, res: Response) => {
    const roomId = String(req.params.id || '').trim().toUpperCase();
    const { guestProfile } = req.body;
    if (!guestProfile || !guestProfile.uid) {
      return res.status(400).json({ error: 'Guest profile required' });
    }

    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ error: `Room ${roomId} not found` });
    }

    // If host is returning to an already started match
    if (room.hostId === guestProfile.uid && room.status === 'playing') {
      return res.json({ room });
    }

    // If host is joining their own waiting room (e.g. testing in 2nd tab or solo duel)
    if (room.hostId === guestProfile.uid && room.status === 'waiting') {
      const challengerId = `${guestProfile.uid}_challenger_${Date.now()}`;
      room.guestId = challengerId;
      room.guestName = `${guestProfile.displayName} (Challenger)`;
      room.guestAvatar = guestProfile.avatar === 'cyber-ninja' ? 'solar-phoenix' : 'cyber-ninja';
      room.guestMark = 'O';
      room.status = 'playing';
      room.updatedAt = new Date().toISOString();

      rooms.set(roomId, room);
      broadcastRoom(room);
      return res.json({ room, isChallenger: true });
    }

    // If room is already concluded or abandoned
    if (room.status === 'completed' || room.status === 'abandoned') {
      return res.status(410).json({ error: `Match room "${roomId}" is no longer active. This battle has already ended.` });
    }

    // If another guest already in room
    if (room.guestId && room.guestId !== guestProfile.uid) {
      return res.status(409).json({ error: `Match room "${roomId}" is already full with 2 players.` });
    }

    room.guestId = guestProfile.uid;
    room.guestName = guestProfile.displayName;
    room.guestAvatar = guestProfile.avatar;
    room.guestMark = 'O';
    room.status = 'playing';
    room.updatedAt = new Date().toISOString();

    rooms.set(roomId, room);
    broadcastRoom(room);
    res.json({ room });
  });

  // API Routes: Quick Match / Auto Matchmaking
  app.post('/api/rooms/quickmatch', (req: Request, res: Response) => {
    const { playerProfile, mode } = req.body;
    if (!playerProfile || !playerProfile.uid) {
      return res.status(400).json({ error: 'Player profile required' });
    }

    const selectedMode = mode || 'classic3x3';

    // 1. Look for existing open room
    for (const room of rooms.values()) {
      if (room.status === 'waiting' && room.mode === selectedMode && room.hostId !== playerProfile.uid) {
        room.guestId = playerProfile.uid;
        room.guestName = playerProfile.displayName;
        room.guestAvatar = playerProfile.avatar;
        room.guestMark = 'O';
        room.status = 'playing';
        room.updatedAt = new Date().toISOString();
        rooms.set(room.id, room);
        broadcastRoom(room);
        return res.json({ room, isHost: false });
      }
    }

    // 2. Otherwise create a new waiting room
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let newId = '';
    for (let i = 0; i < 6; i++) {
      newId += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const cellCount =
      selectedMode === 'grid12x12' ? 144 : selectedMode === 'grid6x6' ? 36 : selectedMode === 'grid4x4' ? 16 : 9;

    const newRoom: OnlineRoom = {
      id: newId,
      mode: selectedMode,
      status: 'waiting',
      hostId: playerProfile.uid,
      hostName: playerProfile.displayName,
      hostAvatar: playerProfile.avatar,
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

    rooms.set(newId, newRoom);
    broadcastRoom(newRoom);
    res.json({ room: newRoom, isHost: true });
  });

  // API Routes: Submit a move
  app.post('/api/rooms/:id/move', (req: Request, res: Response) => {
    const roomId = String(req.params.id || '').trim().toUpperCase();
    const { nextBoard, nextTurn, lastIndex, nextXPieces, nextOPieces, winner, winningLine } = req.body;

    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ error: `Room ${roomId} not found` });
    }

    room.board = nextBoard;
    room.currentTurn = nextTurn;
    room.lastMoveIndex = lastIndex;
    if (nextXPieces !== undefined) room.xPieceIndices = nextXPieces;
    if (nextOPieces !== undefined) room.oPieceIndices = nextOPieces;
    if (winner !== undefined) room.winner = winner;
    if (winningLine !== undefined) room.winningLine = winningLine;
    room.updatedAt = new Date().toISOString();

    rooms.set(roomId, room);
    broadcastRoom(room);
    res.json({ room });
  });

  // API Routes: Send chat message
  app.post('/api/rooms/:id/chat', (req: Request, res: Response) => {
    const roomId = String(req.params.id || '').trim().toUpperCase();
    const { senderId, senderName, senderAvatar, text } = req.body;

    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ error: `Room ${roomId} not found` });
    }

    const trimmed = String(text || '').trim().slice(0, 150);
    if (!trimmed) {
      return res.status(400).json({ error: 'Empty message' });
    }

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId,
      senderName,
      senderAvatar,
      text: trimmed,
      timestamp: Date.now(),
    };

    room.messages = [...(room.messages || []).slice(-49), newMsg];
    room.updatedAt = new Date().toISOString();

    rooms.set(roomId, room);
    broadcastRoom(room);
    res.json({ message: newMsg, room });
  });

  // API Routes: Send quick emote
  app.post('/api/rooms/:id/emote', (req: Request, res: Response) => {
    const roomId = String(req.params.id || '').trim().toUpperCase();
    const { senderId, senderName, emoji } = req.body;

    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ error: `Room ${roomId} not found` });
    }

    room.lastEmote = {
      senderId,
      senderName,
      emoji,
      timestamp: Date.now(),
    };
    room.updatedAt = new Date().toISOString();

    rooms.set(roomId, room);
    broadcastRoom(room);
    res.json({ room });
  });

  // API Routes: Rematch request
  app.post('/api/rooms/:id/rematch', (req: Request, res: Response) => {
    const roomId = String(req.params.id || '').trim().toUpperCase();
    const { requesterId, cellCount } = req.body;

    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ error: `Room ${roomId} not found` });
    }

    if (room.rematchRequestedBy && room.rematchRequestedBy !== requesterId) {
      // Both agreed, reset board
      room.board = Array(Number(cellCount) || 9).fill(null);
      room.currentTurn = 'X';
      room.winner = null;
      room.winningLine = null;
      room.lastMoveIndex = null;
      room.xPieceIndices = [];
      room.oPieceIndices = [];
      room.status = 'playing';
      room.rematchRequestedBy = null;
    } else {
      room.rematchRequestedBy = requesterId;
    }

    room.updatedAt = new Date().toISOString();
    rooms.set(roomId, room);
    broadcastRoom(room);
    res.json({ room });
  });

  // API Routes: Real-Time SSE Stream for a room
  app.get('/api/rooms/:id/events', (req: Request, res: Response) => {
    const roomId = String(req.params.id || '').trim().toUpperCase();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    if (!roomClients.has(roomId)) {
      roomClients.set(roomId, new Set());
    }
    roomClients.get(roomId)!.add(res);

    // Send immediate initial state if room exists
    const current = rooms.get(roomId);
    if (current) {
      res.write(`data: ${JSON.stringify(current)}\n\n`);
    }

    // Keep-alive heartbeat ping every 15 seconds
    const heartbeat = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch {
        clearInterval(heartbeat);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeat);
      roomClients.get(roomId)?.delete(res);
      if (roomClients.get(roomId)?.size === 0) {
        roomClients.delete(roomId);
      }
    });
  });

  // Vite Integration (Dev Middleware or Static Dist in Prod)
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Apex Arena server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
