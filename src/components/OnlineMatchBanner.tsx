import React from 'react';
import { MatchRoom } from '../types/user';
import { Player } from '../types/game';
import { Wifi, Copy, Check, LogOut, RotateCcw } from 'lucide-react';
import { sound } from '../utils/audio';

interface OnlineMatchBannerProps {
  room: MatchRoom;
  localPlayerMark: Player;
  isMyTurn: boolean;
  onLeaveRoom: () => void;
  onRematch: () => void;
}

export const OnlineMatchBanner: React.FC<OnlineMatchBannerProps> = ({
  room,
  localPlayerMark,
  isMyTurn,
  onLeaveRoom,
  onRematch,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyCode = () => {
    sound.playClick();
    navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const opponentName =
    localPlayerMark === 'X' ? room.guestName || 'Waiting...' : room.hostName;
  const opponentAvatar =
    localPlayerMark === 'X' ? room.guestAvatar || '⌛' : room.hostAvatar;

  return (
    <div className="w-full max-w-xl mx-auto mb-4 p-3 bg-slate-900/90 border border-purple-500/40 rounded-2xl shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-100">
      {/* Room and Status info */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
          <Wifi className="w-4 h-4 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <span>Online Match</span>
            <button
              onClick={handleCopyCode}
              className="text-[11px] font-mono text-purple-300 hover:text-white bg-purple-950/60 border border-purple-800/80 px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer"
              title="Copy Room Code"
            >
              <span>#{room.id}</span>
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <div className="text-[10px] text-slate-400">
            Vs <strong className="text-slate-200">{opponentName}</strong> ({opponentAvatar})
          </div>
        </div>
      </div>

      {/* Turn & Status Indicator */}
      <div className="flex items-center gap-2">
        <div
          className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border shadow-sm ${
            room.status === 'completed'
              ? 'bg-amber-950/40 text-amber-300 border-amber-500/60'
              : isMyTurn
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/80 animate-pulse'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}
        >
          {room.status === 'completed' ? (
            <span>Match Concluded</span>
          ) : isMyTurn ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Your Turn ({localPlayerMark})</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Opponent's Move</span>
            </>
          )}
        </div>

        {/* Rematch if completed */}
        {room.status === 'completed' && (
          <button
            onClick={onRematch}
            className="py-1 px-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Rematch</span>
          </button>
        )}

        {/* Leave Match */}
        <button
          onClick={onLeaveRoom}
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl border border-slate-800 transition-colors cursor-pointer"
          title="Leave Online Match"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
