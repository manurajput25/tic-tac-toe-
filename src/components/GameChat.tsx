import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, UserProfile } from '../types/game';
import { AVATAR_PRESETS, sendRoomChatMessage } from '../utils/firebase';
import { sound } from '../utils/audio';
import {
  MessageSquare,
  Send,
  X,
  Sparkles,
  ChevronDown,
  Smile,
  Zap,
} from 'lucide-react';

interface GameChatProps {
  roomId: string;
  userProfile: UserProfile;
  messages: ChatMessage[];
  opponentName: string;
}

const QUICK_CHATS = [
  'Good luck! 🍀',
  'Nice move! 👏',
  'Thinking... 🧠',
  'Well played! 🔥',
  'Rematch? ⚔️',
  'Almost had you! 😅',
  'GG! 🏆',
  'Your turn! ⏳',
];

export const GameChat: React.FC<GameChatProps> = ({
  roomId,
  userProfile,
  messages = [],
  opponentName,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showQuickPresets, setShowQuickPresets] = useState<boolean>(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSeenMsgCount = useRef<number>(messages.length);

  // Track unread messages when chat is closed
  useEffect(() => {
    if (!isOpen) {
      const newCount = messages.length - lastSeenMsgCount.current;
      if (newCount > 0) {
        setUnreadCount((prev) => prev + newCount);
        sound.playTick();
      }
    } else {
      setUnreadCount(0);
      lastSeenMsgCount.current = messages.length;
    }
  }, [messages.length, isOpen]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    sound.playClick();
    setInputText('');
    await sendRoomChatMessage(
      roomId,
      userProfile.uid,
      userProfile.displayName,
      userProfile.avatar,
      text
    );
  };

  const getAvatarPreset = (avatarId: string) => {
    return AVATAR_PRESETS.find((a) => a.id === avatarId) || AVATAR_PRESETS[0];
  };

  return (
    <>
      {/* Floating Toggle Button (Bottom-Left) */}
      {!isOpen && (
        <button
          onClick={() => {
            sound.playClick();
            setIsOpen(true);
            setUnreadCount(0);
            lastSeenMsgCount.current = messages.length;
          }}
          aria-label="Open In-Game Chat"
          className="fixed bottom-5 left-5 z-40 flex items-center gap-2 p-3 sm:px-4 sm:py-2.5 rounded-2xl bg-slate-900/95 text-white border border-cyan-500/40 shadow-[0_8px_30px_rgba(6,182,212,0.3)] hover:border-cyan-400 hover:scale-105 active:scale-95 transition-all cursor-pointer backdrop-blur-xl group"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px] font-black rounded-full bg-rose-500 text-white animate-bounce shadow-md">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="text-xs font-bold hidden sm:inline">
            Battle Chat
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </button>
      )}

      {/* Slide-Up Chat Window */}
      {isOpen && (
        <div className="fixed bottom-5 left-3 sm:left-5 z-40 w-[calc(100vw-24px)] sm:w-80 sm:max-w-sm rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-cyan-500/40 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-3 sm:p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/80">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-500">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Match Chat
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                  with <strong className="text-cyan-500">{opponentName}</strong>
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setIsOpen(false);
              }}
              className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="h-64 sm:h-72 overflow-y-auto p-3 space-y-2.5 bg-slate-50/50 dark:bg-slate-950/40 text-xs">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
                <Sparkles className="w-8 h-8 text-cyan-500/40 mb-2" />
                <p className="font-semibold text-xs text-slate-500 dark:text-slate-400">
                  No messages yet
                </p>
                <p className="text-[11px] text-slate-400">
                  Send a quick tactical emote or greeting to your opponent!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === userProfile.uid;
                const avatar = getAvatarPreset(msg.senderAvatar);
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-1.5 ${
                      isMe ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {!isMe && (
                      <div
                        className={`w-6 h-6 rounded-lg bg-gradient-to-br ${avatar.gradient} flex items-center justify-center text-xs shrink-0 shadow-sm`}
                        title={msg.senderName}
                      >
                        {avatar.emoji}
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] px-3 py-2 rounded-2xl text-xs break-words shadow-sm ${
                        isMe
                          ? 'bg-cyan-500 text-slate-950 font-medium rounded-br-none'
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-bl-none'
                      }`}
                    >
                      {!isMe && (
                        <div className="text-[9px] font-bold text-cyan-600 dark:text-cyan-400 mb-0.5">
                          {msg.senderName}
                        </div>
                      )}
                      <div>{msg.text}</div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick-Chat Bar */}
          {showQuickPresets && (
            <div className="p-2 border-t border-slate-200 dark:border-slate-800/80 bg-slate-100/60 dark:bg-slate-900/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {QUICK_CHATS.map((phrase) => (
                <button
                  key={phrase}
                  type="button"
                  onClick={() => handleSendMessage(phrase)}
                  className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 text-[10px] font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  {phrase}
                </button>
              ))}
            </div>
          )}

          {/* Message Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900"
          >
            <input
              type="text"
              maxLength={150}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type message..."
              className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold transition-all cursor-pointer disabled:cursor-not-allowed shadow-sm"
              title="Send Message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
