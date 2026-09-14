import { useEffect, useState, type ReactNode } from 'react';

export type Ratio = 'portrait' | 'square' | 'landscape' | 'wide';

const RATIO: Record<Ratio, string> = {
  portrait: '4 / 5',
  square: '1 / 1',
  landscape: '3 / 2',
  wide: '16 / 9',
};

export interface ImageFrameProps {
  src?: string | null;
  alt: string;
  ratio?: Ratio;
  fit?: 'cover' | 'contain';
  /** Rendered when there is no source, or the source fails to load. */
  fallback: ReactNode;
  className?: string;
  /** Above-the-fold images opt out of lazy loading. */
  priority?: boolean;
  children?: ReactNode;
}

/**
 * The single image container for the product.
 *
 * The frame owns the aspect ratio, the crop and the radius; the asset never decides
 * layout. A missing or failed asset renders the supplied fallback in exactly the same
 * box, so a row of cards keeps its rhythm whether artwork exists or not.
 */
export function ImageFrame({
  src,
  alt,
  ratio = 'portrait',
  fit = 'cover',
  fallback,
  className,
  priority = false,
  children,
}: ImageFrameProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>(
    src ? 'loading' : 'idle',
  );

  useEffect(() => {
    setStatus(src ? 'loading' : 'idle');
  }, [src]);

  const showFallback = !src || status === 'error';

  return (
    <div
      className={['frame', className].filter(Boolean).join(' ')}
      style={{ aspectRatio: RATIO[ratio] }}
      data-state={showFallback ? 'placeholder' : status}
    >
      {showFallback ? (
        fallback
      ) : (
        <img
          className="frame__img"
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          style={{ objectFit: fit }}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
      )}
      {children}
    </div>
  );
}
