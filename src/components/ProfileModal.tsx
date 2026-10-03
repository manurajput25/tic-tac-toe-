import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PRESET_AVATARS } from '../types/user';
import {
  X,
  User,
  Trophy,
  Flame,
  Copy,
  Check,
  LogOut,
  Save,
  Sparkles,
  Smartphone,
  Mail,
  Edit2,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface ProfileModalProps {
  onClose: () => void;
  onOpenOnlineLobby?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose, onOpenOnlineLobby }) => {
  const { profile, updateProfile, logout } = useAuth();

  const [username, setUsername] = useState<string>(profile?.username || '');
  const [displayName, setDisplayName] = useState<string>(profile?.displayName || '');
  const [selectedAvatarKey, setSelectedAvatarKey] = useState<string>(
    profile?.avatarKey || PRESET_AVATARS[0].id
  );
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  if (!profile) return null;

  const currentAvatar =
    PRESET_AVATARS.find((a) => a.id === selectedAvatarKey) || PRESET_AVATARS[0];

  const winRate =
    profile.stats.totalGames > 0
      ? Math.round((profile.stats.wins / profile.stats.totalGames) * 100)
      : 0;

  const handleCopyId = () => {
    sound.playClick();
    navigator.clipboard.writeText(profile.playerId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setSaving(true);
    sound.playClick();
    try {
      await updateProfile({
        username: username.trim(),
        displayName: displayName.trim() || username.trim(),
        avatarKey: selectedAvatarKey,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    sound.playClick();
    await logout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg p-5 sm:p-6 bg-slate-900 border border-slate-700/80 rounded-[32px] shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400" />
            <h3 className="font-display text-lg font-bold text-white tracking-tight">
              Challenger Profile & ID
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card Summary Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 mb-5 relative overflow-hidden">
          <div className="flex items-center gap-3.5">
            {/* Avatar Icon */}
            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${currentAvatar.bg} flex items-center justify-center text-2xl shadow-lg border border-white/20 shrink-0`}
            >
              {profile.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile.displayName}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <span>{currentAvatar.icon}</span>
              )}
            </div>

            {/* Info & ID */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-white truncate">{profile.displayName}</h4>
                <span className="text-[10px] text-cyan-300 font-mono bg-cyan-950/60 border border-cyan-800/80 px-1.5 py-0.5 rounded-full shrink-0">
                  Online
                </span>
              </div>
              <div className="text-xs text-slate-400 truncate">@{profile.username}</div>

              {/* Player ID with 1-click Copy */}
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700 flex items-center gap-1.5">
                  <span>ID: {profile.playerId}</span>
                  <button
                    onClick={handleCopyId}
                    className="text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                    title="Copy Player ID to clipboard"
                  >
                    {isCopied ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </span>
                {isCopied && (
                  <span className="text-[10px] text-emerald-400 font-semibold animate-pulse">
                    Copied!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contact Verification Tag */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-3 text-[11px] text-slate-400">
            {profile.email && (
              <div className="flex items-center gap-1 truncate">
                <Mail className="w-3 h-3 text-cyan-400" />
                <span className="truncate">{profile.email}</span>
              </div>
            )}
            {profile.phoneNumber && (
              <div className="flex items-center gap-1 truncate font-mono">
                <Smartphone className="w-3 h-3 text-purple-400" />
                <span>{profile.phoneNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Player Stats Grid */}
        <div className="mb-5">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2.5">
            Battlefield Statistics
          </span>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-base font-bold text-emerald-400 font-mono">
                {profile.stats.wins}
              </div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Victories</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-base font-bold text-rose-400 font-mono">
                {profile.stats.losses}
              </div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Defeats</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-base font-bold text-slate-300 font-mono">
                {profile.stats.draws}
              </div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Ties</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 text-center">
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between px-3">
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                <Trophy className="w-3.5 h-3.5" />
                <span>Win Rate</span>
              </div>
              <span className="text-sm font-bold font-mono text-white">{winRate}%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between px-3">
              <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold">
                <Flame className="w-3.5 h-3.5" />
                <span>Best Streak</span>
              </div>
              <span className="text-sm font-bold font-mono text-white">
                {profile.stats.bestStreak}
              </span>
            </div>
          </div>
        </div>

        {/* Edit Profile Form */}
        <form onSubmit={handleSave} className="space-y-4 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Customize Identity</span>
            </span>
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Saved!
              </span>
            )}
          </div>

          {/* Avatar Icon Palette */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1.5">Choose Avatar Emblem</label>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_AVATARS.map((av) => (
                <button
                  type="button"
                  key={av.id}
                  onClick={() => setSelectedAvatarKey(av.id)}
                  className={`h-11 rounded-xl flex items-center justify-center text-lg transition-all cursor-pointer bg-gradient-to-br ${
                    av.bg
                  } ${
                    selectedAvatarKey === av.id
                      ? 'ring-2 ring-white scale-105 shadow-md shadow-cyan-500/20'
                      : 'opacity-70 hover:opacity-100 hover:scale-102'
                  }`}
                  title={av.name}
                >
                  {av.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Username & Display Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Unique Username</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-mono">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  maxLength={25}
                  required
                  className="w-full bg-slate-950 text-white text-xs rounded-xl pl-7 pr-3 py-2.5 border border-slate-700 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={40}
                required
                className="w-full bg-slate-950 text-white text-xs rounded-xl px-3 py-2.5 border border-slate-700 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="py-2.5 px-3.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 border border-rose-900/60 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg active:scale-95 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>

        {/* Quick Launch Online PVP Button */}
        {onOpenOnlineLobby && (
          <div className="mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={() => {
                onClose();
                onOpenOnlineLobby();
              }}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>Play Online with Another Player</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
