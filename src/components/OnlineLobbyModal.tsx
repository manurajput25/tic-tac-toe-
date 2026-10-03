import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MatchRoom } from '../types/user';
import { GameMode } from '../types/game';
import {
  createOnlineRoom,
  joinOnlineRoom,
  fetchOpenRooms,
  leaveOnlineRoom,
  subscribeToRoom,
} from '../services/multiplayerService';
import {
  X,
  Users,
  Plus,
  ArrowRight,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Wifi,
  AlertCircle,
  Radio,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface OnlineLobbyModalProps {
  onClose: () => void;
  onEnterOnlineMatch: (room: MatchRoom) => void;
  onRequireAuth: () => void;
}

export const OnlineLobbyModal: React.FC<OnlineLobbyModalProps> = ({
  onClose,
  onEnterOnlineMatch,
  onRequireAuth,
}) => {
  const { user, profile } = useAuth();

  const [activeTab, setActiveTab] = useState<'create' | 'join' | 'browse'>('create');
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic3x3');
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [createdRoom, setCreatedRoom] = useState<MatchRoom | null>(null);
  const [openRooms, setOpenRooms] = useState<MatchRoom[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // If not logged in, show prompt
  if (!profile) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
        <div className="relative w-full max-w-sm p-6 bg-slate-900 border border-slate-700/80 rounded-[32px] shadow-2xl text-center text-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-3 text-cyan-400">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-display text-lg font-bold text-white mb-1">
            Challenger Account Required
          </h3>
          <p className="text-xs text-slate-400 mb-5">
            Log in with Google or Mobile OTP to unlock online multiplayer, matchmaking, and player rankings.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onClose();
                onRequireAuth();
              }}
              className="flex-1 py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all"
            >
              Sign In / Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fetch open rooms for browsing
  const loadOpenRooms = async () => {
    setLoading(true);
    try {
      const rooms = await fetchOpenRooms();
      setOpenRooms(rooms);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'browse') {
      loadOpenRooms();
    }
  }, [activeTab]);

  // Subscribe to created room to detect when an opponent joins
  useEffect(() => {
    if (!createdRoom) return;

    const unsubscribe = subscribeToRoom(createdRoom.id, (updated) => {
      if (updated && updated.status === 'playing' && updated.guestId) {
        sound.playWin();
        onEnterOnlineMatch(updated);
        onClose();
      }
    });

    return () => unsubscribe();
  }, [createdRoom]);

  // Handle Create Match Room
  const handleCreateRoom = async () => {
    setLoading(true);
    setError(null);
    sound.playClick();
    try {
      const room = await createOnlineRoom(
        profile.uid,
        profile.displayName || profile.username,
        profile.avatarKey,
        selectedMode
      );
      setCreatedRoom(room);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create room.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Join Match Room
  const handleJoinRoom = async (codeToJoin?: string) => {
    const code = codeToJoin || roomCodeInput;
    if (!code.trim()) {
      setError('Please enter a 6-digit room code.');
      return;
    }

    setLoading(true);
    setError(null);
    sound.playClick();
    try {
      const room = await joinOnlineRoom(
        code.trim(),
        profile.uid,
        profile.displayName || profile.username,
        profile.avatarKey
      );
      sound.playWin();
      onEnterOnlineMatch(room);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to join match.');
    } finally {
      setLoading(false);
    }
  };

  // Cancel Room
  const handleCancelCreatedRoom = async () => {
    if (createdRoom) {
      await leaveOnlineRoom(createdRoom.id, profile.uid);
      setCreatedRoom(null);
    }
  };

  // Copy Room Code
  const handleCopyCode = () => {
    if (!createdRoom) return;
    sound.playClick();
    navigator.clipboard.writeText(createdRoom.id);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md p-5 sm:p-6 bg-slate-900 border border-slate-700/80 rounded-[32px] shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-white tracking-tight">
                Online Multiplayer Arena
              </h3>
              <p className="text-[11px] text-slate-400">Challenge another player in real-time</p>
            </div>
          </div>
          <button
            onClick={() => {
              handleCancelCreatedRoom();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* IF WAITING IN CREATED ROOM */}
        {createdRoom ? (
          <div className="text-center py-4 space-y-4">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <span className="absolute inset-0 rounded-full border-2 border-cyan-500/40 animate-ping opacity-60" />
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-400/60 flex items-center justify-center text-cyan-400">
                <Radio className="w-8 h-8 animate-pulse" />
              </div>
            </div>

            <div>
              <h4 className="font-display text-base font-bold text-white mb-0.5">
                Waiting for Opponent to Join...
              </h4>
              <p className="text-xs text-slate-400">Share this 6-digit match code with your friend:</p>
            </div>

            {/* Room Code Display */}
            <div className="p-3 bg-slate-950 border border-cyan-500/40 rounded-2xl flex items-center justify-center gap-3">
              <span className="font-mono text-3xl font-extrabold tracking-widest text-cyan-300">
                {createdRoom.id}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 text-slate-400 hover:text-cyan-300 bg-slate-900 rounded-xl border border-slate-700 hover:border-cyan-500/60 transition-colors"
                title="Copy code"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="text-[11px] text-slate-500">
              Game Mode: <strong className="text-slate-300 uppercase">{createdRoom.mode}</strong>
            </div>

            <button
              onClick={handleCancelCreatedRoom}
              className="py-2.5 px-5 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 rounded-xl border border-rose-900/60 transition-colors"
            >
              Cancel Match
            </button>
          </div>
        ) : (
          /* LOBBY TABS */
          <div>
            <div className="grid grid-cols-3 gap-1.5 p-1 mb-4 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                onClick={() => setActiveTab('create')}
                className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'create'
                    ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Room
              </button>
              <button
                onClick={() => setActiveTab('join')}
                className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'join'
                    ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Enter Code
              </button>
              <button
                onClick={() => setActiveTab('browse')}
                className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'browse'
                    ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Public Arena
              </button>
            </div>

            {/* TAB: CREATE ROOM */}
            {activeTab === 'create' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Select Game Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'classic3x3' as GameMode, label: 'Classic 3x3', desc: 'Standard rules' },
                      { id: 'infinite3' as GameMode, label: 'Infinite 3', desc: 'Old marks vanish' },
                      { id: 'grid4x4' as GameMode, label: 'Grid 4x4', desc: 'Connect 4 to win' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMode(m.id)}
                        className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                          selectedMode === m.id
                            ? 'bg-cyan-950/40 text-cyan-300 border-cyan-500 shadow-sm ring-1 ring-cyan-500/50'
                            : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="text-xs font-bold">{m.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{m.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCreateRoom}
                  disabled={loading}
                  className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{loading ? 'Creating Room...' : 'Create Private Match Room'}</span>
                </button>
              </div>
            )}

            {/* TAB: JOIN BY CODE */}
            {activeTab === 'join' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Enter 6-Digit Room Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 748291"
                    autoFocus
                    className="w-full bg-slate-950 text-center text-2xl font-mono font-extrabold tracking-widest text-cyan-300 rounded-2xl px-4 py-3.5 border border-slate-700 focus:outline-none focus:border-cyan-400"
                  />
                  <p className="text-[11px] text-slate-400 mt-2 text-center">
                    Ask your friend for their 6-digit match code to connect instantly.
                  </p>
                </div>

                <button
                  onClick={() => handleJoinRoom()}
                  disabled={loading || roomCodeInput.length !== 6}
                  className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  <span>{loading ? 'Connecting...' : 'Join Match Room'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* TAB: BROWSE OPEN ROOMS */}
            {activeTab === 'browse' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Waiting Match Rooms ({openRooms.length})</span>
                  <button
                    onClick={loadOpenRooms}
                    className="hover:text-cyan-400 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {openRooms.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800">
                      No open rooms waiting right now. Create one and invite a friend!
                    </div>
                  ) : (
                    openRooms.map((r) => (
                      <div
                        key={r.id}
                        className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between hover:border-cyan-500/50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{r.hostAvatar || '⚔️'}</span>
                          <div>
                            <div className="text-xs font-bold text-white">{r.hostName}</div>
                            <div className="text-[10px] text-slate-400 font-mono uppercase">
                              Mode: {r.mode} · Code: {r.id}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleJoinRoom(r.id)}
                          className="py-1.5 px-3 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 font-bold text-xs rounded-xl border border-cyan-500/40 transition-all cursor-pointer"
                        >
                          Join
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
