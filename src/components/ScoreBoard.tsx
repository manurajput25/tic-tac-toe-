import React, { useState, useEffect, useRef } from 'react';
import { Player, GameScore, OpponentType, BotDifficulty, ThemeConfig } from '../types/game';
import { Bot, User, Flame, Clock } from 'lucide-react';
import { UserAvatar } from './UserAvatar';

interface ScoreBoardProps {
  score: GameScore;
  currentPlayer: Player;
  opponent: OpponentType;
  botDifficulty: BotDifficulty;
  theme: ThemeConfig;
  blitzTimeLeft: number | null;
  blitzDuration: number | null;
  roundNumber: number;
  isBotThinking: boolean;
  playerXLabel?: string;
  playerOLabel?: string;
  playerXAvatar?: string | null;
  playerXPhotoURL?: string | null;
  playerOAvatar?: string | null;
  playerOPhotoURL?: string | null;
  onlineRoomCode?: string | null;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  score,
  currentPlayer,
  opponent,
  botDifficulty,
  theme,
  blitzTimeLeft,
  blitzDuration,
  roundNumber,
  isBotThinking,
  playerXLabel,
  playerOLabel,
  playerXAvatar,
  playerXPhotoURL,
  playerOAvatar,
  playerOPhotoURL,
  onlineRoomCode,
}) => {
  const isXTurn = currentPlayer === 'X';
  const isOTurn = currentPlayer === 'O';

  // Animation trackers for dynamically loaded profile pictures in online matches
  const [xAvatarKey, setXAvatarKey] = useState<number>(0);
  const [oAvatarKey, setOAvatarKey] = useState<number>(0);
  const [xBloom, setXBloom] = useState<boolean>(false);
  const [oBloom, setOBloom] = useState<boolean>(false);

  const prevXPhoto = useRef<string | null | undefined>(playerXPhotoURL);
  const prevOPhoto = useRef<string | null | undefined>(playerOPhotoURL);
  const prevOLabel = useRef<string | undefined>(playerOLabel);
  const isInitialMount = useRef<boolean>(true);

  useEffect(() => {
    if (opponent !== 'online') return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      setXAvatarKey((k) => k + 1);
      setXBloom(true);
      const timer = setTimeout(() => setXBloom(false), 800);
      return () => clearTimeout(timer);
    }
  }, [opponent]);

  useEffect(() => {
    if (opponent !== 'online') return;

    // Trigger subtle entry animation when host photoURL dynamically resolves/changes
    if (playerXPhotoURL && playerXPhotoURL !== prevXPhoto.current) {
      prevXPhoto.current = playerXPhotoURL;
      setXAvatarKey((k) => k + 1);
      setXBloom(true);
      const timer = setTimeout(() => setXBloom(false), 800);
      return () => clearTimeout(timer);
    }
  }, [playerXPhotoURL, opponent]);

  useEffect(() => {
    if (opponent !== 'online') return;

    const wasWaiting = !prevOLabel.current || prevOLabel.current.includes('Waiting');
    const isNowJoined = playerOLabel && !playerOLabel.includes('Waiting');
    const photoChanged = playerOPhotoURL && playerOPhotoURL !== prevOPhoto.current;

    if ((wasWaiting && isNowJoined) || photoChanged) {
      prevOPhoto.current = playerOPhotoURL;
      prevOLabel.current = playerOLabel;
      setOAvatarKey((k) => k + 1);
      setOBloom(true);
      const timer = setTimeout(() => setOBloom(false), 800);
      return () => clearTimeout(timer);
    }
  }, [playerOPhotoURL, playerOLabel, opponent]);

  // Format difficulty text
  const difficultyLabel =
    botDifficulty === 'unbeatable' ? 'Master AI' : botDifficulty === 'medium' ? 'Tactician' : 'Casual';

  const xDisplayName =
    opponent === 'bot'
      ? 'You'
      : opponent === 'online'
      ? playerXLabel || 'Host (X)'
      : 'Player X';

  const oDisplayName =
    opponent === 'bot'
      ? 'Robot'
      : opponent === 'online'
      ? playerOLabel || 'Opponent (O)'
      : 'Player O';

  return (
    <div className="w-full max-w-xl mx-auto mb-3 sm:mb-5">
      {/* Upper Meta line: Unboxed metadata with typographic separators */}
      <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mb-2 sm:mb-3 px-1 tabular-nums gap-1">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onlineRoomCode && (
            <span className="font-mono font-bold text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
              #{onlineRoomCode}
            </span>
          )}
          <span className="font-semibold text-slate-700 dark:text-slate-300">Round {roundNumber}</span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
          <span>Draws: {score.draws}</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span
            className={`flex items-center gap-1 font-bold px-2 sm:px-2.5 py-0.5 rounded-full border transition-all text-[10px] sm:text-xs ${
              score.currentStreak >= 3
                ? 'bg-gradient-to-r from-amber-500/25 via-orange-500/30 to-rose-500/25 text-amber-600 dark:text-amber-300 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.45)] ring-1 ring-amber-400/80'
                : 'text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10 border-amber-500/20 shadow-sm'
            }`}
          >
            <Flame
              className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                score.currentStreak >= 3
                  ? 'text-orange-500 fill-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)] animate-pulse'
                  : 'text-amber-500 animate-pulse'
              }`}
            />
            <span>Streak {score.currentStreak} {score.currentStreak >= 3 ? '🔥' : ''}</span>
          </span>
          <span aria-hidden="true" className="hidden xs:inline text-slate-300 dark:text-slate-600">·</span>
          <span className="hidden xs:inline text-slate-400 dark:text-slate-500">Best {score.bestStreak}</span>
        </div>
      </div>

      {/* Main Player Versus Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 relative">
        {/* Player X Card */}
        <div
          className={`p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all duration-300 relative overflow-hidden backdrop-blur-xl ${
            isXTurn
              ? 'bg-white/95 dark:bg-slate-900/90 border-cyan-500/60 shadow-[0_4px_20px_rgba(6,182,212,0.15)] dark:shadow-[0_0_30px_rgba(6,182,212,0.22)] scale-[1.02]'
              : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-75 hover:opacity-90'
          }`}
          style={isXTurn ? { borderColor: `${theme.xColor}90` } : {}}
        >
          {/* Top specular reflection */}
          <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-white/15 to-transparent pointer-events-none" />

          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              {/* Profile Avatar & Corner Mark Badge */}
              <div className="relative shrink-0">
                {opponent === 'online' || playerXPhotoURL ? (
                  <div
                    key={`player-x-avatar-${xAvatarKey}`}
                    className={`relative shrink-0 ${
                      opponent === 'online' ? 'animate-avatar-entry' : ''
                    }`}
                  >
                    {/* Subtle bloom highlight on dynamic load in online matches */}
                    {xBloom && opponent === 'online' && (
                      <span
                        className="absolute -inset-1.5 rounded-2xl animate-avatar-bloom pointer-events-none"
                        style={{
                          background: `radial-gradient(circle, ${theme.xColor}55 0%, transparent 70%)`,
                        }}
                      />
                    )}
                    <UserAvatar
                      avatar={playerXAvatar}
                      photoURL={playerXPhotoURL}
                      size="md"
                      className="ring-2 ring-cyan-500/40 relative z-10"
                    />
                    <span
                      className={`absolute -bottom-1 -right-1 w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-black shadow-md border-2 border-white dark:border-slate-900 leading-none select-none z-20 ${
                        opponent === 'online' ? 'animate-badge-pop' : ''
                      }`}
                      style={{
                        backgroundColor: theme.xColor,
                        color: '#020617',
                        boxShadow: isXTurn ? `0 0 10px ${theme.xGlow}` : undefined,
                      }}
                      title="Player X"
                    >
                      ✕
                    </span>
                  </div>
                ) : (
                  <div
                    className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center font-display font-black text-base sm:text-xl shadow-inner border shrink-0"
                    style={{
                      backgroundColor: `${theme.xColor}18`,
                      color: theme.xColor,
                      borderColor: `${theme.xColor}40`,
                      boxShadow: isXTurn ? `0 0 12px ${theme.xGlow}` : 'none',
                    }}
                  >
                    ✕
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 tracking-wide truncate max-w-[65px] xs:max-w-[95px] sm:max-w-[130px]">
                    {xDisplayName}
                  </span>
                  <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400 shrink-0" />
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {isXTurn ? (
                    <span className="text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping inline-block shrink-0" />
                      <span className="truncate">Turn</span>
                    </span>
                  ) : (
                    'Waiting'
                  )}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-slate-900 dark:text-white tabular-nums tracking-tight">
                {score.playerX}
              </div>
              <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">Wins</div>
            </div>
          </div>

          {/* Bottom active edge bar */}
          {isXTurn && (
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5 shadow-sm"
              style={{ backgroundColor: theme.xColor }}
            />
          )}
        </div>

        {/* Player O Card */}
        <div
          className={`p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all duration-300 relative overflow-hidden backdrop-blur-xl ${
            isOTurn
              ? 'bg-white/95 dark:bg-slate-900/90 border-rose-500/60 shadow-[0_4px_20px_rgba(244,63,94,0.15)] dark:shadow-[0_0_30px_rgba(244,63,94,0.22)] scale-[1.02]'
              : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-75 hover:opacity-90'
          }`}
          style={isOTurn ? { borderColor: `${theme.oColor}90` } : {}}
        >
          {/* Top specular reflection */}
          <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-white/15 to-transparent pointer-events-none" />

          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              {/* Profile Avatar & Corner Mark Badge */}
              <div className="relative shrink-0">
                {opponent === 'online' ? (
                  (!playerOLabel || playerOLabel.includes('Waiting')) && !playerOPhotoURL ? (
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl border-2 border-dashed border-rose-500/40 bg-rose-500/10 flex items-center justify-center animate-pulse text-rose-500 text-xs">
                      <Clock className="w-4 h-4 animate-spin text-rose-400" />
                    </div>
                  ) : (
                    <div
                      key={`player-o-avatar-${oAvatarKey}`}
                      className="relative shrink-0 animate-avatar-entry"
                    >
                      {/* Subtle bloom highlight on dynamic load in online matches */}
                      {oBloom && (
                        <span
                          className="absolute -inset-1.5 rounded-2xl animate-avatar-bloom pointer-events-none"
                          style={{
                            background: `radial-gradient(circle, ${theme.oColor}55 0%, transparent 70%)`,
                          }}
                        />
                      )}
                      <UserAvatar
                        avatar={playerOAvatar || 'solar-phoenix'}
                        photoURL={playerOPhotoURL}
                        size="md"
                        className="ring-2 ring-rose-500/40 relative z-10"
                      />
                      <span
                        className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-black shadow-md border-2 border-white dark:border-slate-900 leading-none select-none z-20 animate-badge-pop"
                        style={{
                          backgroundColor: theme.oColor,
                          color: '#020617',
                          boxShadow: isOTurn ? `0 0 10px ${theme.oGlow}` : undefined,
                        }}
                        title="Player O"
                      >
                        ◯
                      </span>
                    </div>
                  )
                ) : opponent === 'bot' ? (
                  <div
                    className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center font-display font-black text-base sm:text-xl shadow-inner border shrink-0"
                    style={{
                      backgroundColor: `${theme.oColor}18`,
                      color: theme.oColor,
                      borderColor: `${theme.oColor}40`,
                      boxShadow: isOTurn ? `0 0 12px ${theme.oGlow}` : 'none',
                    }}
                  >
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
                  </div>
                ) : playerOPhotoURL || playerOAvatar ? (
                  <>
                    <UserAvatar
                      avatar={playerOAvatar}
                      photoURL={playerOPhotoURL}
                      size="md"
                      className="ring-2 ring-rose-500/40"
                    />
                    <span
                      className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-black shadow-md border-2 border-white dark:border-slate-900 leading-none select-none"
                      style={{
                        backgroundColor: theme.oColor,
                        color: '#020617',
                        boxShadow: isOTurn ? `0 0 10px ${theme.oGlow}` : undefined,
                      }}
                      title="Player O"
                    >
                      ◯
                    </span>
                  </>
                ) : (
                  <div
                    className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center font-display font-black text-base sm:text-xl shadow-inner border shrink-0"
                    style={{
                      backgroundColor: `${theme.oColor}18`,
                      color: theme.oColor,
                      borderColor: `${theme.oColor}40`,
                      boxShadow: isOTurn ? `0 0 12px ${theme.oGlow}` : 'none',
                    }}
                  >
                    ◯
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 tracking-wide truncate max-w-[65px] xs:max-w-[95px] sm:max-w-[130px]">
                    {oDisplayName}
                  </span>
                  {opponent === 'bot' ? (
                    <Bot className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-500 dark:text-cyan-400 shrink-0" />
                  ) : (
                    <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400 shrink-0" />
                  )}
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {isOTurn ? (
                    isBotThinking ? (
                      <span className="text-rose-600 dark:text-rose-400 font-semibold animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block shrink-0" />
                        <span className="truncate">Thinking...</span>
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block shrink-0" />
                        <span className="truncate">Turn</span>
                      </span>
                    )
                  ) : opponent === 'bot' ? (
                    `${difficultyLabel}`
                  ) : (
                    'Waiting'
                  )}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-slate-900 dark:text-white tabular-nums tracking-tight">
                {score.playerO}
              </div>
              <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">Wins</div>
            </div>
          </div>

          {/* Bottom active edge bar */}
          {isOTurn && (
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5 shadow-sm"
              style={{ backgroundColor: theme.oColor }}
            />
          )}
        </div>
      </div>

      {/* Blitz Timer Bar (when blitz timer is active) */}
      {blitzDuration !== null && blitzTimeLeft !== null && (
        <div className="mt-3 bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/90 flex items-center gap-3 backdrop-blur-md shadow-sm">
          <Clock className={`w-3.5 h-3.5 ${blitzTimeLeft <= 3 ? 'text-rose-500 animate-bounce' : 'text-slate-400'}`} />
          <div className="flex-1 bg-slate-200 dark:bg-slate-800/90 rounded-full h-2 overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                blitzTimeLeft <= 3
                  ? 'bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_0_10px_rgba(244,63,94,0.6)]'
                  : isXTurn
                  ? 'bg-gradient-to-r from-cyan-500 to-sky-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                  : 'bg-gradient-to-r from-rose-500 to-pink-400 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
              }`}
              style={{ width: `${(blitzTimeLeft / blitzDuration) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold tabular-nums text-slate-700 dark:text-slate-200 min-w-[28px] text-right">
            {blitzTimeLeft}s
          </span>
        </div>
      )}
    </div>
  );
};
