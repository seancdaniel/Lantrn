import type { ReactNode } from 'react';
import { useCountUp, useInView } from '@/hooks';
import { formatInt, formatMiles } from '@/lib/format';

type Tone = 'ember' | 'moss' | 'gold' | 'ink';

/* Animated figures ---------------------------------------------------------- */

export function Metric({
  value,
  decimals = 0,
  duration = 1100,
  suffix,
}: {
  value: number;
  decimals?: number;
  duration?: number;
  suffix?: string;
}) {
  const animated = useCountUp(value, duration, decimals);
  const text = decimals > 0 ? formatMiles(animated, decimals as 1 | 2) : formatInt(animated);
  return (
    <span className="numeric">
      {text}
      {suffix}
    </span>
  );
}

/* Ring ---------------------------------------------------------------------- */

export function ProgressRing({
  value,
  size = 132,
  stroke = 9,
  tone = 'ember',
  label,
  children,
  ariaLabel,
}: {
  value: number;
  size?: number;
  stroke?: number;
  tone?: Tone;
  label?: string;
  children?: ReactNode;
  ariaLabel?: string;
}) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, value));
  const offset = circumference * (1 - (inView ? clamped : 0));

  return (
    <div
      className="ring"
      ref={ref}
      style={{ width: size, height: size }}
      role="img"
      aria-label={ariaLabel ?? `${Math.round(clamped * 100)} percent complete`}
    >
      <svg width={size} height={size}>
        <circle className="ring__track" cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} />
        <circle
          className={`ring__value${tone !== 'ember' ? ` ring__value--${tone}` : ''}`}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="ring__center">
        <span>
          <span className="ring__pct" style={{ fontSize: size * 0.215 }}>
            <Metric value={clamped * 100} />%
          </span>
          {label && size >= 110 ? <span className="ring__label">{label}</span> : null}
          {children}
        </span>
      </span>
    </div>
  );
}

/* Bar ----------------------------------------------------------------------- */

export function ProgressBar({
  value,
  tone = 'ember',
  thickness = 'default',
  ticks,
  ariaLabel,
}: {
  value: number;
  tone?: Tone;
  thickness?: 'thin' | 'default' | 'thick';
  ticks?: number[];
  ariaLabel?: string;
}) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const clamped = Math.max(0, Math.min(1, value));

  return (
    <div
      ref={ref}
      className={['bar', thickness !== 'default' ? `bar--${thickness}` : ''].filter(Boolean).join(' ')}
      role="progressbar"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <span
        className={`bar__fill${tone !== 'ember' ? ` bar__fill--${tone}` : ''}`}
        style={{ width: `${(inView ? clamped : 0) * 100}%` }}
      />
      {ticks?.length ? (
        <span className="bar__ticks">
          {ticks.map((t) => (
            <span key={t} className="bar__tick" style={{ left: `${t * 100}%` }} />
          ))}
        </span>
      ) : null}
    </div>
  );
}
