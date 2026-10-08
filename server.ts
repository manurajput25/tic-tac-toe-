import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE = path.resolve(__dirname, '.rooms-cache.json');
const ACCOUNTS_FILE = path.resolve(__dirname, '.accounts-cache.json');

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
  hostPhotoURL?: string | null;
  hostMark: 'X';
  guestId?: string | null;
  guestName?: string | null;
  guestAvatar?: string | null;
  guestPhotoURL?: string | null;
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

interface StoredUserAccount {
  uid: string;
  email: string;
  displayName: string;
  username: string; // unique, permanent handle based on email
  avatar: string;
  photoURL?: string | null;
  bio?: string;
  website?: string;
  title: string;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  bestStreak: number;
  passwordHash?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

const accountsByEmail = new Map<string, StoredUserAccount>();

// Generates a unique, non-changeable gamer handle based on user email
function generateUniqueHandleFromEmail(
  email: string,
  existingAccounts: Map<string, StoredUserAccount>
): string {
  const rawPrefix =
    email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 16) || 'player';
  let candidate = rawPrefix;
  const takenHandles = new Set(
    Array.from(existingAccounts.values()).map((a) => a.username.toLowerCase())
  );
  let counter = 1;
  while (takenHandles.has(candidate)) {
    candidate = `${rawPrefix.slice(0, 12)}_${counter}`;
    counter++;
  }
  return candidate;
}

function loadAccountsFromDisk() {
  try {
    if (fs.existsSync(ACCOUNTS_FILE)) {
      const raw = fs.readFileSync(ACCOUNTS_FILE, 'utf-8');
      const list = JSON.parse(raw) as StoredUserAccount[];
      for (const acc of list) {
        if (acc && acc.email) {
          accountsByEmail.set(acc.email.toLowerCase().trim(), acc);
        }
      }
      console.log(`Loaded ${accountsByEmail.size} user accounts from disk`);
    }
  } catch (err) {
    console.warn('Could not load cached accounts:', err);
  }
}

function saveAccountsToDisk() {
  try {
    const list = Array.from(accountsByEmail.values());
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save accounts to disk:', err);
  }
}

loadAccountsFromDisk();

interface PendingVerification {
  code: string;
  email: string;
  displayName: string;
  username?: string;
  avatar?: string;
  photoURL?: string | null;
  bio?: string;
  website?: string;
  password?: string;
  expiresAt: number;
}

const pendingVerifications = new Map<string, PendingVerification>();

// Mail transporter configuration
const mailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : undefined,
});

async function sendAccountVerificationEmail(toEmail: string, code: string, displayName: string) {
  try {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await mailTransporter.sendMail({
        from: process.env.SMTP_FROM || '"Apex Arena" <no-reply@apexarena.game>',
        to: toEmail,
        subject: `Apex Arena - Verification Code: ${code}`,
        text: `Hello ${displayName},\n\nYour account verification code is: ${code}\n\nOnce entered: your account has been created successfully!\n\nWelcome to Apex Arena!`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #030712; color: #f9fafb; padding: 32px 24px; border-radius: 20px; max-width: 520px; margin: auto; border: 1px solid #1f2937;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #06b6d4; font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">Apex Arena</h1>
              <p style="color: #9ca3af; font-size: 13px; margin-top: 6px;">Next-Gen Multiplayer Tic-Tac-Toe</p>
            </div>
            <div style="background-color: #111827; border: 1px solid #374151; border-radius: 16px; padding: 24px; text-align: center;">
              <p style="color: #e5e7eb; font-size: 15px; margin: 0 0 16px 0;">Welcome, <strong>${displayName}</strong>! Verify your email to activate your account.</p>
              <div style="background: #1f2937; border: 2px dashed #06b6d4; border-radius: 12px; padding: 18px; margin: 16px 0;">
                <div style="font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px;">Your 6-Digit Code</div>
                <div style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #38bdf8; font-family: monospace;">${code}</div>
              </div>
              <p style="color: #10b981; font-weight: 600; font-size: 13px; margin: 12px 0 0 0;">✨ Your account has been created successfully once verified!</p>
            </div>
            <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 24px;">Code expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>
          </div>
        `,
      });
      console.log(`[AUTH] Sent verification email to ${toEmail}`);
    } else {
      console.log(`[AUTH] Simulated email to ${toEmail} with code ${code}`);
    }
  } catch (err) {
    console.warn(`[AUTH] Could not send live email to ${toEmail}:`, err);
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '2mb' }));

  // ---------------- AUTH API ROUTES ----------------

  // Check if an email is already registered
  app.post('/api/auth/check-email', (req: Request, res: Response) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    const exists = accountsByEmail.has(email);
    res.json({ exists, email });
  });

  // Request 6-digit verification code for new account registration
  app.post('/api/auth/send-code', async (req: Request, res: Response) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const displayName = String(req.body.displayName || email.split('@')[0]).trim();
    const username = String(req.body.username || email.split('@')[0]).trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const avatar = String(req.body.avatar || 'cyber-ninja');
    const photoURL = req.body.photoURL ? String(req.body.photoURL) : null;
    const bio = req.body.bio ? String(req.body.bio).slice(0, 300) : '';
    const website = req.body.website ? String(req.body.website).slice(0, 200) : '';
    const password = String(req.body.password || '');

    if (!email || !email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Rule: "ek email se ek hi account bane"
    if (accountsByEmail.has(email)) {
      return res.status(409).json({
        error: 'An account with this email already exists. Please log in instead.',
        isExistingUser: true,
      });
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    pendingVerifications.set(email, {
      code,
      email,
      displayName,
      username,
      avatar,
      photoURL,
      bio,
      website,
      password,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    await sendAccountVerificationEmail(email, code, displayName);

    res.json({
      success: true,
      message: `Verification code sent to ${email}`,
      code, // returned so preview users without external SMTP can also instantly verify
      email,
    });
  });

  // Verify code and complete account registration
  app.post('/api/auth/verify-code', (req: Request, res: Response) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const code = String(req.body.code || '').trim();

    const pending = pendingVerifications.get(email);
    if (!pending) {
      return res.status(400).json({
        error: 'No pending verification found for this email. Please request a new code.',
      });
    }

    if (Date.now() > pending.expiresAt) {
      pendingVerifications.delete(email);
      return res.status(400).json({
        error: 'Verification code has expired. Please request a new code.',
      });
    }

    if (pending.code !== code) {
      return res.status(400).json({
        error: 'Invalid verification code. Please check your email and try again.',
      });
    }

    // Ensure email is not already registered
    if (accountsByEmail.has(email)) {
      pendingVerifications.delete(email);
      return res.status(409).json({
        error: 'An account with this email already exists.',
      });
    }

    // Generate unique, non-changeable gamer handle based on user email
    const uniqueHandle = generateUniqueHandleFromEmail(email, accountsByEmail);

    // Create verified account
    const uid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newAccount: StoredUserAccount = {
      uid,
      email,
      displayName: pending.displayName || email.split('@')[0],
      username: uniqueHandle, // UNIQUE PERMANENT HANDLE BASED ON EMAIL
      avatar: pending.avatar || 'cyber-ninja',
      photoURL: pending.photoURL || null,
      bio: pending.bio || '',
      website: pending.website || '',
      title: 'Arena Tactician',
      totalGames: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      bestStreak: 0,
      passwordHash: pending.password ? Buffer.from(pending.password).toString('base64') : undefined,
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    accountsByEmail.set(email, newAccount);
    saveAccountsToDisk();
    pendingVerifications.delete(email);

    res.json({
      success: true,
      message: 'your account has been created sucessfully',
      profile: newAccount,
    });
  });

  // Login existing user with email & password
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    const account = accountsByEmail.get(email);
    if (!account) {
      return res.status(404).json({
        error: 'No account registered with this email. Please create a new account.',
        isNewUser: true,
      });
    }

    if (account.passwordHash && password) {
      const enteredHash = Buffer.from(password).toString('base64');
      if (account.passwordHash !== enteredHash) {
        return res.status(401).json({ error: 'Incorrect password. Please try again.' });
      }
    }

    res.json({
      success: true,
      message: `Welcome back, ${account.displayName}!`,
      profile: account,
    });
  });

  // Save profile updates (display name, bio, website, avatar can be updated; username is permanently locked)
  app.post('/api/auth/save-profile', (req: Request, res: Response) => {
    const profile = req.body.profile as StoredUserAccount;
    if (!profile || !profile.email) {
      return res.status(400).json({ error: 'Profile and email required' });
    }
    const email = profile.email.toLowerCase().trim();
    const existing = accountsByEmail.get(email);
    const merged: StoredUserAccount = {
      ...(existing || {}),
      ...profile,
      // Display name is changeable, but gamer handle is unique & permanently locked
      username: existing ? existing.username : profile.username,
      bio: profile.bio ? String(profile.bio).slice(0, 300) : (existing?.bio || ''),
      website: profile.website ? String(profile.website).slice(0, 200) : (existing?.website || ''),
      email,
      updatedAt: new Date().toISOString(),
    };
    accountsByEmail.set(email, merged);
    saveAccountsToDisk();
    res.json({ success: true, profile: merged });
  });

  // ---------------- ROOMS API ROUTES ----------------
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
      room.guestPhotoURL = guestProfile.photoURL || null;
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
    room.guestPhotoURL = guestProfile.photoURL || null;
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
      selectedMode === 'grid6x6' ? 36 : selectedMode === 'grid4x4' ? 16 : 9;

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
