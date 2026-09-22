import lanternLight from '@/assets/brand/lantern.png';
import lanternDark from '@/assets/brand/lantern-dark.png';

/**
 * The brandmark is an image asset, same rule as character artwork: the code
 * frames it, the illustration fills it.
 *
 * Two files rather than a CSS filter. The drawing is black linework around an
 * amber flame, and a blanket invert would have turned the flame blue — so the
 * dark variant lightens only the linework and leaves the flame alone. Swapping
 * in CSS rather than JavaScript means the in-app toggle and the untouched
 * system default both work without a re-render.
 */
export function Brandmark({ size = 34, className }: { size?: number; className?: string }) {
  return (
    <span
      className={['brandmark', className].filter(Boolean).join(' ')}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <img className="brandmark__art brandmark__art--light" src={lanternLight} alt="" />
      <img className="brandmark__art brandmark__art--dark" src={lanternDark} alt="" />
    </span>
  );
}

export function Wordmark({ withTagline = true }: { withTagline?: boolean }) {
  return (
    <span className="wordmark">
      Lantrn
      {withTagline ? <span className="wordmark__sub">Every mile counts</span> : null}
    </span>
  );
}
