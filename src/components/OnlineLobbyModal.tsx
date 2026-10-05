import React, { useState, useEffect } from 'react';
import { GameMode, UserProfile, OnlineRoom } from '../types/game';
import {
  createOnlineRoom,
  joinOnlineRoom,
  quickMatchOnline,
  subscribeToOnlineRoom,
  subscribeToOpenRooms,
  generateRoomCode,
  AVATAR_PRESETS,
} from '../utils/firebase';
import { sound } from '../utils/audio';
import {
  X,
  Globe,
  Plus,
  ArrowRight,
  Copy,
  Check,
  Users,
  Radio,
  RefreshCw,
  AlertCircle,
  Clock,
  SearchX,
  WifiOff,
  Loader2,
  ShieldAlert,
  XCircle,
  Zap,
} from 'lucide-react';

interface OnlineLobbyModalProps {
  userProfile: UserProfile;
  onOpenProfile: () => void;
  onRoomJoined: (room: OnlineRoom, isHost: boolean) => void;
  onClose: () => void;
}

type ActionStatus = 'idle' | 'loading' | 'success' | 'failure';

interface JoinErrorFeedback {
  type: 'invalid-code' | 'not-found' | 'inactive' | 'full' | 'network' | 'general';
  title: string;
  message: string;
  codeAttempted?: string;
  actionHint?: string;
}

export const OnlineLobbyModal: React.FC<OnlineLobbyModalProps> = ({
  userProfile,
  onOpenProfile,
  onRoomJoined,
  onClose,
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic3x3');
  const [joinCode, setJoinCode] = useState<string>('');
  const [openRooms, setOpenRooms] = useState<OnlineRoom[]>([]);
  const [isCreatingRoom, setIsCreatingRoom] = useState<boolean>(false);
  const [joinCodeStatus, setJoinCodeStatus] = useState<ActionStatus>('idle');
  const [openRoomStatus, setOpenRoomStatus] = useState<Record<string, ActionStatus>>({});
  const [errorFeedback, setErrorFeedback] = useState<JoinErrorFeedback | null>(null);
  const [waitingRoom, setWaitingRoom] = useState<OnlineRoom | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [isRefreshingRooms, setIsRefreshingRooms] = useState<boolean>(false);
  const [isQuickMatching, setIsQuickMatching] = useState<boolean>(false);

  // Subscribe to public open rooms waiting for an opponent
  useEffect(() => {
    const unsub = subscribeToOpenRooms((rooms) => {
      // Show all live waiting rooms (with special badge for user's own room)
      setOpenRooms(rooms);
    });
    return () => unsub();
  }, []);

  // When host is waiting in a room, listen to it to detect when opponent joins
  useEffect(() => {
    if (!waitingRoom) return;

    const unsubRoom = subscribeToOnlineRoom(waitingRoom.id, (updatedRoom) => {
      if (updatedRoom.status === 'playing' && updatedRoom.guestId) {
        sound.playWin();
        onRoomJoined(updatedRoom, true);
      }
    });

    return () => {
      if (unsubRoom) unsubRoom();
    };
  }, [waitingRoom, onRoomJoined]);

  const handleQuickMatch = async () => {
    setIsQuickMatching(true);
    setErrorFeedback(null);
    try {
      sound.playClick();
      const res = await quickMatchOnline(selectedMode, userProfile);
      if (!res.isHost && res.room.status === 'playing') {
        sound.playWin();
        onRoomJoined(res.room, false);
      } else {
        setWaitingRoom(res.room);
      }
    } catch (err: unknown) {
      console.warn('Quick match auto-fallback:', err);
      handleCreateRoom();
    } finally {
      setIsQuickMatching(false);
    }
  };

  const handleCreateRoom = async () => {
    setIsCreatingRoom(true);
    setErrorFeedback(null);
    try {
      sound.playClick();
      const room = await createOnlineRoom(selectedMode, userProfile);
      setWaitingRoom(room);
    } catch (err: unknown) {
      console.warn('Primary room creation warning, generating fallback:', err);
      try {
        const fallbackCode = generateRoomCode();
        const fallbackRoom = await createOnlineRoom(selectedMode, userProfile, fallbackCode);
        setWaitingRoom(fallbackRoom);
      } catch (fallbackErr: unknown) {
        setErrorFeedback({
          type: 'general',
          title: 'Unable to Create Room',
          message:
            fallbackErr instanceof Error
              ? fallbackErr.message
              : 'Could not establish connection to the multiplayer game server.',
          actionHint: 'Check your internet connection and try again.',
        });
      }
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleJoinByCode = async (codeToJoin?: string) => {
    const isManualInput = !codeToJoin;
    const rawCode = codeToJoin || joinCode;
    const clean = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Set Loading State
    if (isManualInput) {
      setJoinCodeStatus('loading');
    } else {
      setOpenRoomStatus((prev) => ({ ...prev, [clean]: 'loading' }));
    }
    setErrorFeedback(null);

    // Validate Code Format
    if (!clean) {
      if (isManualInput) {
        setJoinCodeStatus('failure');
        setTimeout(() => setJoinCodeStatus('idle'), 2500);
      }
      setErrorFeedback({
        type: 'invalid-code',
        title: 'Invalid Room ID',
        message: 'Room ID is required. Please enter a valid 4 to 8-character battle room ID to join.',
        actionHint: 'Ask your friend or match host for their room code (e.g. APEX99).',
      });
      return;
    }

    if (clean.length < 4 || clean.length > 10) {
      if (isManualInput) {
        setJoinCodeStatus('failure');
        setTimeout(() => setJoinCodeStatus('idle'), 2500);
      } else {
        setOpenRoomStatus((prev) => ({ ...prev, [clean]: 'failure' }));
        setTimeout(() => setOpenRoomStatus((prev) => ({ ...prev, [clean]: 'idle' })), 2500);
      }
      setErrorFeedback({
        type: 'invalid-code',
        title: 'Invalid Room ID',
        message: `"${clean}" is not a valid room ID. Battle room IDs must be 4 to 8 characters in length.`,
        codeAttempted: clean,
        actionHint: 'Check for typos and enter the exact room ID.',
      });
      return;
    }

    try {
      sound.playClick();
      const room = await joinOnlineRoom(clean, userProfile);

      // Success Scenario!
      if (isManualInput) {
        setJoinCodeStatus('success');
      } else {
        setOpenRoomStatus((prev) => ({ ...prev, [clean]: 'success' }));
      }
      sound.playWin();

      // Brief transition delay so user visually sees the green Success state
      setTimeout(() => {
        onRoomJoined(room, false);
      }, 500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);

      // Failure Scenario!
      if (isManualInput) {
        setJoinCodeStatus('failure');
        setTimeout(() => setJoinCodeStatus('idle'), 3000);
      } else {
        setOpenRoomStatus((prev) => ({ ...prev, [clean]: 'failure' }));
        setTimeout(() => setOpenRoomStatus((prev) => ({ ...prev, [clean]: 'idle' })), 3000);
      }

      if (msg.includes('not found') || msg.includes('Verify')) {
        setErrorFeedback({
          type: 'not-found',
          title: 'Invalid Room ID',
          message: `No active battle room was found with code "${clean}". The room may not exist, was mistyped, or has expired.`,
          codeAttempted: clean,
          actionHint: 'Verify the room code with the host or host a new battle room above.',
        });
      } else if (msg.includes('no longer active') || msg.includes('ended') || msg.includes('concluded')) {
        setErrorFeedback({
          type: 'inactive',
          title: 'Invalid Room ID (Match Concluded)',
          message: `Room "${clean}" is no longer active. This battle has already finished.`,
          codeAttempted: clean,
          actionHint: 'Ask the host to start a fresh battle room or host one yourself.',
        });
      } else if (msg.includes('already full') || msg.includes('2 players')) {
        setErrorFeedback({
          type: 'full',
          title: 'Invalid Room ID (Room Full)',
          message: `Room "${clean}" already has two players engaged in battle.`,
          codeAttempted: clean,
          actionHint: 'Pick an open arena from below or create your own room.',
        });
      } else if (msg.includes('Network') || msg.includes('connection')) {
        setErrorFeedback({
          type: 'network',
          title: 'Connection Error',
          message: 'Unable to reach the game server to connect to this room.',
          actionHint: 'Please check your network connection and retry.',
        });
      } else {
        setErrorFeedback({
          type: 'general',
          title: 'Invalid Room ID',
          message: msg,
          codeAttempted: clean,
          actionHint: 'Double check the room code and try again.',
        });
      }
    }
  };

  const handleCopyCode = () => {
    if (!waitingRoom) return;
    navigator.clipboard.writeText(waitingRoom.id);
    setCopiedCode(true);
    sound.playClick();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleManualRefresh = () => {
    setIsRefreshingRooms(true);
    sound.playClick();
    setTimeout(() => setIsRefreshingRooms(false), 600);
  };

  const activeAvatar =
    AVATAR_PRESETS.find((a) => a.id === userProfile.avatar) || AVATAR_PRESETS[0];

  const isAnyJoining =
    joinCodeStatus === 'loading' ||
    Object.values(openRoomStatus).some((s) => s === 'loading');

  return (
    <div
      role="dialog"
      aria-label="Online Multiplayer Arena"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xl animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="relative w-full max-w-xl my-auto p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl text-slate-900 dark:text-slate-100 overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500 shadow-sm">
              <Globe className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  Online Multiplayer
                </h2>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Cross-device matchmaking with real-time turns & live chat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close Online Lobby"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gamer Profile Ribbon */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${activeAvatar.gradient} flex items-center justify-center text-lg shadow-sm border border-white/20`}
            >
              {activeAvatar.emoji}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {userProfile.displayName}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  @{userProfile.username}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {userProfile.wins}W · {userProfile.losses}L · {userProfile.bestStreak}x Best Streak
              </div>
            </div>
          </div>
          <button
            onClick={onOpenProfile}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-cyan-600 dark:text-cyan-400 transition-colors cursor-pointer"
          >
            Edit Profile
          </button>
        </div>

        {/* ⚡ Quick Play Auto Matchmaker */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-teal-500/10 border border-cyan-500/30 flex items-center justify-between gap-3 mb-4 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
              <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Instant Auto-Match</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">Live</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Find an open match or battle instantly without codes
              </div>
            </div>
          </div>
          <button
            type="button"
            disabled={isQuickMatching || isCreatingRoom || joinCodeStatus === 'loading'}
            onClick={handleQuickMatch}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-extrabold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-60 flex items-center gap-1.5 shrink-0"
          >
            {isQuickMatching ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Matching...</span>
              </>
            ) : (
              <>
                <Zap className="w-3 h-3 fill-current" />
                <span>Quick Play</span>
              </>
            )}
          </button>
        </div>

        {/* Clear 'Invalid Room ID' Feedback Banner in Red Text */}
        {errorFeedback && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800/80 text-red-900 dark:text-red-200 animate-in fade-in duration-150">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-1.5 rounded-xl bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400 shrink-0">
                {errorFeedback.type === 'not-found' ? (
                  <SearchX className="w-4 h-4" />
                ) : errorFeedback.type === 'inactive' ? (
                  <Clock className="w-4 h-4" />
                ) : errorFeedback.type === 'full' ? (
                  <Users className="w-4 h-4" />
                ) : errorFeedback.type === 'network' ? (
                  <WifiOff className="w-4 h-4" />
                ) : errorFeedback.type === 'invalid-code' ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <ShieldAlert className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-wide flex items-center gap-1.5">
                    <span>{errorFeedback.title}</span>
                    {errorFeedback.codeAttempted && (
                      <span className="px-1.5 py-0.2 rounded bg-red-200/60 dark:bg-red-900/80 text-[10px] font-mono text-red-700 dark:text-red-300">
                        {errorFeedback.codeAttempted}
                      </span>
                    )}
                  </h4>
                  <button
                    onClick={() => setErrorFeedback(null)}
                    className="text-red-400 hover:text-red-700 dark:hover:text-red-200 transition-colors p-0.5 cursor-pointer"
                    aria-label="Dismiss Error"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-red-700 dark:text-red-300 font-medium mt-1 leading-relaxed">
                  {errorFeedback.message}
                </p>
                {errorFeedback.actionHint && (
                  <p className="text-[10px] text-red-600/90 dark:text-red-400/90 font-medium mt-1.5 flex items-center gap-1">
                    <span>💡 Tip:</span>
                    <span>{errorFeedback.actionHint}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Waiting Room Overlay if Host created room */}
        {waitingRoom ? (
          <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/40 text-center text-white relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/40 mx-auto mb-3 flex items-center justify-center relative">
              <Radio className="w-8 h-8 text-cyan-400 animate-pulse" />
              <div className="absolute inset-0 rounded-full border border-cyan-400 animate-ping opacity-30" />
            </div>

            <h3 className="font-display text-xl font-black text-white mb-1">
              Waiting for Challenger...
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Share this battle code with a friend on any phone or computer:
            </p>

            {/* Room Code Badge */}
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-800/90 border border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.3)] mb-4">
              <span className="font-mono text-3xl font-black tracking-widest text-cyan-300">
                {waitingRoom.id}
              </span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-md active:scale-95"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400">
              Match Mode: <strong className="text-white uppercase">{waitingRoom.mode}</strong>
            </div>

            {/* Instant Challenger Test Button for Solo Testing */}
            <div className="mt-4 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <span className="text-[11px] text-slate-400 text-center sm:text-left">
                Want to test multiplayer gameplay right now without a second device?
              </span>
              <button
                type="button"
                onClick={async () => {
                  sound.playClick();
                  const testGuest: UserProfile = {
                    uid: `guest_${Date.now()}`,
                    displayName: 'Cyber Challenger',
                    username: 'challenger_99',
                    avatar: 'solar-phoenix',
                    totalGames: 12,
                    wins: 8,
                    losses: 4,
                    draws: 0,
                    bestStreak: 4,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  };
                  const joined = await joinOnlineRoom(waitingRoom.id, testGuest);
                  onRoomJoined(joined, true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap active:scale-95"
              >
                ⚔️ Start Match (Simulate Challenger)
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-center">
              <button
                onClick={() => setWaitingRoom(null)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel Room
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Create Room & Join by Code in 2 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Option 1: Create Room */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-2 font-display text-sm font-bold text-slate-900 dark:text-white">
                    <Plus className="w-4 h-4 text-cyan-500" />
                    <span>Host New Room</span>
                  </div>

                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1.5">
                    Select Match Mode:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 mb-3">
                    {[
                      { id: 'classic3x3', label: 'Classic 3×3' },
                      { id: 'infinite3', label: 'Infinite 3' },
                      { id: 'grid4x4', label: 'Grid 4×4' },
                      { id: 'grid6x6', label: 'Grid 6×6' },
                      { id: 'grid12x12', label: '12×12 Epic' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setSelectedMode(m.id as GameMode);
                        }}
                        className={`py-1.5 px-2 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                          selectedMode === m.id
                            ? 'bg-cyan-500/10 border-cyan-500 text-cyan-600 dark:text-cyan-300 font-bold shadow-sm'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCreateRoom}
                  disabled={isCreatingRoom || isAnyJoining}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {isCreatingRoom ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Creating Room...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 text-slate-950" />
                      <span>Host Room</span>
                    </>
                  )}
                </button>
              </div>

              {/* Option 2: Join via Room Code */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-2 font-display text-sm font-bold text-slate-900 dark:text-white">
                    <Users className="w-4 h-4 text-rose-500" />
                    <span>Join with Code</span>
                  </div>

                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                      Enter Room Code:
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {joinCode.length}/8
                    </span>
                  </div>

                  <div className="relative mb-2">
                    <input
                      type="text"
                      maxLength={8}
                      value={joinCode}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                        setJoinCode(val);
                        if (errorFeedback) setErrorFeedback(null);
                        if (joinCodeStatus !== 'idle') setJoinCodeStatus('idle');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && joinCode.trim() && joinCodeStatus !== 'loading') {
                          handleJoinByCode();
                        }
                      }}
                      placeholder="e.g. APEX99"
                      className={`w-full px-3 py-2 text-base font-mono font-bold tracking-widest uppercase bg-white dark:bg-slate-800 border rounded-xl focus:outline-none transition-all text-slate-900 dark:text-white ${
                        joinCodeStatus === 'failure' || (errorFeedback && errorFeedback.type === 'invalid-code')
                          ? 'border-red-500 dark:border-red-500 focus:ring-2 focus:ring-red-500/50 bg-red-50/50 dark:bg-red-950/20'
                          : joinCodeStatus === 'success'
                          ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20'
                          : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-rose-500'
                      }`}
                    />
                    {joinCode && (
                      <button
                        onClick={() => {
                          setJoinCode('');
                          setErrorFeedback(null);
                          setJoinCodeStatus('idle');
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Explicit 'Invalid Room ID' Red Text Helper right below input */}
                  {errorFeedback && (
                    <div className="mb-2.5 flex items-start gap-1 text-red-600 dark:text-red-400 text-[11px] font-semibold animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                      <span>
                        <strong className="font-bold text-red-600 dark:text-red-400">Invalid Room ID: </strong>
                        {errorFeedback.message}
                      </span>
                    </div>
                  )}
                </div>

                {/* Join / Enter Match Button with Loading, Success & Failure States */}
                <button
                  onClick={() => handleJoinByCode()}
                  disabled={
                    joinCodeStatus === 'loading' ||
                    joinCodeStatus === 'success' ||
                    !joinCode.trim() ||
                    isCreatingRoom
                  }
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 shadow-md ${
                    joinCodeStatus === 'loading'
                      ? 'bg-rose-600/90 text-white cursor-wait opacity-90'
                      : joinCodeStatus === 'success'
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-[1.01]'
                      : joinCodeStatus === 'failure'
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] animate-pulse'
                      : 'bg-rose-500 hover:bg-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)] text-white'
                  }`}
                >
                  {joinCodeStatus === 'loading' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Joining Arena...</span>
                    </>
                  ) : joinCodeStatus === 'success' ? (
                    <>
                      <Check className="w-4 h-4 text-white animate-bounce" />
                      <span>Match Joined! Entering Arena...</span>
                    </>
                  ) : joinCodeStatus === 'failure' ? (
                    <>
                      <XCircle className="w-4 h-4 text-white" />
                      <span>Join Failed — Invalid Room ID</span>
                    </>
                  ) : (
                    <>
                      <span>Enter Match</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Public Live Rooms Section */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
                  <span>Open Arenas Waiting for Challenger</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">
                    {openRooms.length} available
                  </span>
                  <button
                    onClick={handleManualRefresh}
                    disabled={isRefreshingRooms}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    title="Refresh open matches"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${isRefreshingRooms ? 'animate-spin text-cyan-500' : ''}`}
                    />
                  </button>
                </div>
              </div>

              {openRooms.length === 0 ? (
                <div className="py-5 px-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-xs text-slate-400 mb-1">
                    No open matches waiting right now.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Click <strong>Host Room</strong> above to create a game and invite a friend!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                  {openRooms.map((room) => {
                    const status = openRoomStatus[room.id] || 'idle';
                    const isOwnRoom = room.hostId === userProfile.uid;
                    return (
                      <div
                        key={room.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                          isOwnRoom
                            ? 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/40'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-cyan-500/50'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {room.hostName}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-cyan-500/15 border border-cyan-500/30 text-[9px] font-mono font-bold text-cyan-500 uppercase">
                              {room.mode}
                            </span>
                            {isOwnRoom && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-bold">
                                Your Arena
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Code: <strong className="text-slate-700 dark:text-slate-300 font-bold">{room.id}</strong>
                          </div>
                        </div>

                        {/* Open Room Card Join Button with States */}
                        <button
                          onClick={() => handleJoinByCode(room.id)}
                          disabled={
                            status === 'loading' ||
                            status === 'success' ||
                            joinCodeStatus === 'loading' ||
                            isCreatingRoom
                          }
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all shrink-0 cursor-pointer shadow-sm active:scale-95 disabled:opacity-60 flex items-center gap-1.5 ${
                            status === 'loading'
                              ? 'bg-cyan-600/80 text-slate-950 cursor-wait'
                              : status === 'success'
                              ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                              : status === 'failure'
                              ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]'
                              : isOwnRoom
                              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold'
                              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                          }`}
                        >
                          {status === 'loading' ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Joining...</span>
                            </>
                          ) : status === 'success' ? (
                            <>
                              <Check className="w-3 h-3 text-white" />
                              <span>Joined!</span>
                            </>
                          ) : status === 'failure' ? (
                            <>
                              <XCircle className="w-3 h-3 text-white" />
                              <span>Failed</span>
                            </>
                          ) : isOwnRoom ? (
                            <span>Enter Duel</span>
                          ) : (
                            <span>Join</span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

