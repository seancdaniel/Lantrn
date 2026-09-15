/**
 * The brandmark is the product in one glyph: a journey ring, most of the way round,
 * with the traveller stopped at roughly the point our own demo account has reached.
 * It survives down to a 16px favicon because it is two shapes and a dot.
 */
export function Brandmark({ size = 34, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={['brandmark', className ?? ''].join(' ').trim()}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="64" height="64" rx="15" fill="var(--ink)" />
      <circle cx="32" cy="32" r="16" fill="none" stroke="var(--canvas)" strokeOpacity="0.26" strokeWidth="4" />
      <path
        d="M32 16a16 16 0 0 1 13.86 24"
        fill="none"
        stroke="var(--ember)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="45.86" cy="40" r="5" fill="var(--ember)" />
    </svg>
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
