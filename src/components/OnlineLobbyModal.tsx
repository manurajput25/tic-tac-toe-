import React, { useState, useEffect } from 'react';
import { GameMode, UserProfile, OnlineRoom } from '../types/game';
import {
  createOnlineRoom,
  joinOnlineRoom,
  subscribeToOpenRooms,
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
  Flame,
  User,
  Radio,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface OnlineLobbyModalProps {
  userProfile: UserProfile;
  onOpenProfile: () => void;
  onRoomJoined: (room: OnlineRoom, isHost: boolean) => void;
  onClose: () => void;
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [waitingRoom, setWaitingRoom] = useState<OnlineRoom | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Subscribe to public open rooms waiting for an opponent
  useEffect(() => {
    const unsub = subscribeToOpenRooms((rooms) => {
      // Filter out rooms created by this user
      setOpenRooms(rooms.filter((r) => r.hostId !== userProfile.uid));
    });
    return () => unsub();
  }, [userProfile.uid]);

  // When host is waiting in a room, listen to it to detect when opponent joins
  useEffect(() => {
    if (!waitingRoom) return;

    let unsubRoom: (() => void) | undefined;
    import('../utils/firebase').then(({ subscribeToOnlineRoom }) => {
      unsubRoom = subscribeToOnlineRoom(waitingRoom.id, (updatedRoom) => {
        if (updatedRoom.status === 'playing' && updatedRoom.guestId) {
          sound.playWin();
          onRoomJoined(updatedRoom, true);
        }
      });
    });

    return () => {
      if (unsubRoom) unsubRoom();
    };
  }, [waitingRoom, onRoomJoined]);

  const handleCreateRoom = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      sound.playClick();
      const room = await createOnlineRoom(selectedMode, userProfile);
      setWaitingRoom(room);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not create room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinByCode = async (codeToJoin?: string) => {
    const code = (codeToJoin || joinCode).trim().toUpperCase();
    if (!code) {
      setErrorMessage('Please enter a 6-character room code');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      sound.playClick();
      const room = await joinOnlineRoom(code, userProfile);
      onRoomJoined(room, false);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to join match');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!waitingRoom) return;
    navigator.clipboard.writeText(waitingRoom.id);
    setCopiedCode(true);
    sound.playClick();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const activeAvatar =
    AVATAR_PRESETS.find((a) => a.id === userProfile.avatar) || AVATAR_PRESETS[0];

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
                  Live Cloud
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Battle real opponents across devices in real time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gamer Profile Ribbon */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 mb-5">
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
              Share this 6-character battle code with a friend to begin:
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
              Game Mode: <strong className="text-white uppercase">{waitingRoom.mode}</strong>
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
          <div className="space-y-5">
            {/* Create Room & Join by Code in 2 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Create Room */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-2 font-display text-sm font-bold text-slate-900 dark:text-white">
                    <Plus className="w-4 h-4 text-cyan-500" />
                    <span>Create Battle Room</span>
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
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 text-slate-950" />
                  <span>Host New Room</span>
                </button>
              </div>

              {/* Option 2: Join via Room Code */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-2 font-display text-sm font-bold text-slate-900 dark:text-white">
                    <Users className="w-4 h-4 text-rose-500" />
                    <span>Join with Code</span>
                  </div>

                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1.5">
                    Enter 6-digit Code:
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. APEX99"
                    className="w-full px-3 py-2 text-base font-mono font-bold tracking-widest uppercase bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white mb-3"
                  />
                </div>

                <button
                  onClick={() => handleJoinByCode()}
                  disabled={isLoading || !joinCode.trim()}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-rose-500 hover:bg-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>Enter Match</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Error Message if any */}
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold text-center">
                {errorMessage}
              </div>
            )}

            {/* Public Live Rooms Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
                  <span>Open Arenas Waiting for Challenger</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  {openRooms.length} available
                </span>
              </div>

              {openRooms.length === 0 ? (
                <div className="py-6 px-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-xs text-slate-400 mb-1">
                    No open matches waiting right now.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Click <strong>Host New Room</strong> above to create a game and invite a friend!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {openRooms.map((room) => (
                    <div
                      key={room.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2 hover:border-cyan-500/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {room.hostName}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-cyan-500/15 border border-cyan-500/30 text-[9px] font-mono font-bold text-cyan-500">
                            {room.mode}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Code: {room.id}
                        </div>
                      </div>

                      <button
                        onClick={() => handleJoinByCode(room.id)}
                        disabled={isLoading}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shrink-0 cursor-pointer shadow-sm active:scale-95"
                      >
                        Join
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
