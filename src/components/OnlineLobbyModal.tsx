import React, { useState, useEffect } from 'react';
import { GameMode, UserProfile, OnlineRoom } from '../types/game';
import {
  createOnlineRoom,
  joinOnlineRoom,
  subscribeToOnlineRoom,
  generateRoomCode,
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
  AlertCircle,
  Clock,
  SearchX,
  WifiOff,
  Loader2,
  ShieldAlert,
  XCircle,
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
  onRoomJoined,
  onClose,
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic3x3');
  const [joinCode, setJoinCode] = useState<string>('');
  const [isCreatingRoom, setIsCreatingRoom] = useState<boolean>(false);
  const [joinCodeStatus, setJoinCodeStatus] = useState<ActionStatus>('idle');
  const [errorFeedback, setErrorFeedback] = useState<JoinErrorFeedback | null>(null);
  const [waitingRoom, setWaitingRoom] = useState<OnlineRoom | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

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
    const rawCode = codeToJoin || joinCode;
    const clean = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Set Loading State
    setJoinCodeStatus('loading');
    setErrorFeedback(null);

    // Validate Code Format
    if (!clean) {
      sound.playClick();
      setJoinCodeStatus('failure');
      setErrorFeedback({
        type: 'invalid-code',
        title: 'Invalid Room ID',
        message: 'Please enter a valid 6-character room battle code (e.g. APEX99).',
        codeAttempted: rawCode || 'EMPTY',
        actionHint: 'Double check the code provided by your opponent.',
      });
      setTimeout(() => setJoinCodeStatus('idle'), 2500);
      return;
    }

    if (clean.length < 4 || clean.length > 10) {
      sound.playClick();
      setJoinCodeStatus('failure');
      setErrorFeedback({
        type: 'invalid-code',
        title: 'Invalid Room ID Length',
        message: `Room ID "${clean}" has ${clean.length} characters. Room IDs are typically 6 characters long.`,
        codeAttempted: clean,
        actionHint: 'Verify all characters were entered without spaces or typos.',
      });
      setTimeout(() => setJoinCodeStatus('idle'), 2500);
      return;
    }

    try {
      sound.playClick();
      const room = await joinOnlineRoom(clean, userProfile);

      setJoinCodeStatus('success');
      sound.playWin();

      setTimeout(() => {
        onRoomJoined(room, false);
      }, 400);
    } catch (err: unknown) {
      setJoinCodeStatus('failure');

      const rawMsg = err instanceof Error ? err.message : String(err);

      if (rawMsg.includes('not found')) {
        setErrorFeedback({
          type: 'not-found',
          title: 'Match Room Not Found',
          message: `No active battle room was found with code "${clean}". The host may have cancelled the room or the code was mistyped.`,
          codeAttempted: clean,
          actionHint: 'Ask the host to re-share their active 6-letter room code.',
        });
      } else if (rawMsg.includes('no longer active') || rawMsg.includes('ended')) {
        setErrorFeedback({
          type: 'inactive',
          title: 'Match Already Concluded',
          message: `Match room "${clean}" has already completed or been abandoned.`,
          codeAttempted: clean,
          actionHint: 'Create a new room or ask your friend to host a fresh match.',
        });
      } else if (rawMsg.includes('already full')) {
        setErrorFeedback({
          type: 'full',
          title: 'Match Arena Full',
          message: `Match room "${clean}" already has 2 players engaged in battle.`,
          codeAttempted: clean,
          actionHint: 'Ask your friend to create a new match room for you.',
        });
      } else if (
        rawMsg.includes('network') ||
        rawMsg.includes('fetch') ||
        rawMsg.includes('offline')
      ) {
        setErrorFeedback({
          type: 'network',
          title: 'Network / Sync Notice',
          message:
            'Could not communicate with the battle server. Checking local device peer channels...',
          codeAttempted: clean,
          actionHint: 'Check your internet connection and try again in a moment.',
        });
      } else {
        setErrorFeedback({
          type: 'general',
          title: 'Unable to Join Match',
          message: rawMsg || 'An unexpected error occurred while joining the arena.',
          codeAttempted: clean,
          actionHint: 'Ensure the host has created the room and is waiting for you.',
        });
      }

      setTimeout(() => {
        setJoinCodeStatus('idle');
      }, 3500);
    }
  };

  const handleCopyCode = () => {
    if (!waitingRoom) return;
    navigator.clipboard.writeText(waitingRoom.id);
    setCopiedCode(true);
    sound.playClick();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isAnyJoining = joinCodeStatus === 'loading';

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

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-center">
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
            {/* Host or Join Choice Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Host a Battle */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                      Host New Battle
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                    Create a match arena and share the 6-character code with your opponent.
                  </p>

                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1.5">
                    Select Match Mode:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 mb-3">
                    {[
                      { id: 'classic3x3', label: 'Classic 3×3' },
                      { id: 'infinite3', label: 'Infinite 3' },
                      { id: 'grid6x6', label: 'Grid 6×6' },
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

              {/* Option 2: Join by Room Code */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                      Join with Code
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                    Enter the battle room code provided by your opponent to connect.
                  </p>

                  <div className="relative mb-3">
                    <input
                      type="text"
                      maxLength={8}
                      value={joinCode}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setJoinCode(val);
                        if (errorFeedback) setErrorFeedback(null);
                        if (joinCodeStatus !== 'idle') setJoinCodeStatus('idle');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleJoinByCode();
                      }}
                      placeholder="e.g. APEX99"
                      className={`w-full px-4 py-3 text-center font-mono font-black text-lg tracking-widest rounded-xl border focus:outline-none focus:ring-2 transition-all ${
                        joinCodeStatus === 'failure' ||
                        (errorFeedback && errorFeedback.type === 'invalid-code')
                          ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-600 focus:ring-red-500'
                          : joinCodeStatus === 'success'
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 focus:ring-emerald-500'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-rose-500 text-slate-900 dark:text-white'
                      }`}
                    />
                  </div>

                  {errorFeedback && errorFeedback.type === 'invalid-code' && (
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
          </div>
        )}
      </div>
    </div>
  );
};
