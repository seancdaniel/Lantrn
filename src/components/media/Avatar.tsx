import { useState } from 'react';

export interface AvatarProps {
  initials: string;
  src?: string | null;
  size?: number;
  accent?: string;
  alt?: string;
}

/**
 * People, not characters. Falls back to initials when there is no photo, and again
 * if the photo fails, so a row of members never loses its alignment.
 */
export function Avatar({ initials, src, size = 34, accent, alt = '' }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(11, Math.round(size * 0.34)),
        background: accent ? `color-mix(in srgb, ${accent} 18%, var(--surface-sunken))` : undefined,
        color: accent ?? undefined,
      }}
      aria-hidden={alt ? undefined : true}
    >
      {showImage ? (
        <img src={src as string} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />
      ) : (
        initials
      )}
    </span>
  );
}
