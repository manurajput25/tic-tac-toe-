import React, { useState } from 'react';
import { AVATAR_PRESETS } from '../utils/firebase';

interface UserAvatarProps {
  avatar?: string | null;
  photoURL?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  alt?: string;
  showVerifiedBadge?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatar,
  photoURL,
  size = 'md',
  className = '',
  alt = 'User avatar',
  showVerifiedBadge = false,
}) => {
  const [imageError, setImageError] = useState<boolean>(false);

  // Determine if there is a custom photo uploaded (either in photoURL or avatar string)
  const isCustomPhoto =
    !imageError &&
    ((photoURL && photoURL.trim().length > 0) ||
      (avatar &&
        (avatar.startsWith('data:image') ||
          avatar.startsWith('http://') ||
          avatar.startsWith('https://') ||
          avatar.startsWith('blob:'))));

  const effectivePhotoSrc = photoURL && photoURL.trim().length > 0 ? photoURL : avatar;

  // Preset avatar fallback
  const preset =
    AVATAR_PRESETS.find((p) => p.id === avatar) || AVATAR_PRESETS[0];

  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px] rounded-md',
    sm: 'w-6 h-6 text-xs rounded-lg',
    md: 'w-8 h-8 sm:w-9 sm:h-9 text-base sm:text-lg rounded-xl',
    lg: 'w-12 h-12 sm:w-14 sm:h-14 text-xl sm:text-2xl rounded-2xl',
    xl: 'w-16 h-16 sm:w-20 sm:h-20 text-2xl sm:text-3xl rounded-3xl',
    '2xl': 'w-24 h-24 sm:w-28 sm:h-28 text-4xl rounded-3xl',
  }[size];

  return (
    <div className={`relative shrink-0 select-none ${className}`}>
      <div
        className={`${sizeClasses} overflow-hidden shadow-sm flex items-center justify-center relative border border-white/20 dark:border-slate-700/60 transition-all ${
          !isCustomPhoto ? `bg-gradient-to-br ${preset.gradient}` : 'bg-slate-800'
        }`}
      >
        {isCustomPhoto && effectivePhotoSrc ? (
          <img
            src={effectivePhotoSrc}
            alt={alt}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover rounded-inherit"
          />
        ) : (
          <span className="leading-none transform translate-y-[1px]">
            {preset.emoji}
          </span>
        )}
      </div>

      {showVerifiedBadge && (
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-sm" />
      )}
    </div>
  );
};
