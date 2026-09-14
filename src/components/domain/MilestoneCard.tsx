import type { MilestoneState } from '@/lib/progress';
import { formatDateLong, formatMiles } from '@/lib/format';
import { ProgressBar } from './Progress';
import { Pill } from '@/components/ui/Primitives';

/**
 * Milestone markers are drawn as roadside stones rather than achievement badges —
 * a place you reached, not a trophy someone handed you.
 */
function Marker({ miles, unlocked }: { miles: number; unlocked: boolean }) {
  const label = miles >= 1000 ? `${miles / 1000}k` : String(miles);
  return (
    <svg width="58" height="72" viewBox="0 0 58 72" aria-hidden="true">
      <path
        d="M29 2 52 12v40c0 8-10 14-23 18C16 66 6 60 6 52V12z"
        fill={unlocked ? 'var(--gold-soft)' : 'var(--surface-sunken)'}
        stroke={unlocked ? 'var(--gold)' : 'var(--line-strong)'}
        strokeWidth="1.6"
        strokeDasharray={unlocked ? undefined : '3 4'}
      />
      <path d="M12 24h34" stroke={unlocked ? 'var(--gold)' : 'var(--line-strong)'} strokeWidth="1.2" opacity="0.6" />
      <text
        x="29"
        y="45"
        textAnchor="middle"
        style={{ font: `600 ${label.length > 3 ? 15 : 18}px var(--font-display)` }}
        fill={unlocked ? 'var(--gold)' : 'var(--ink-4)'}
      >
        {label}
      </text>
      <text
        x="29"
        y="58"
        textAnchor="middle"
        style={{ font: '600 7.5px var(--font-sans)', letterSpacing: '1.4px' }}
        fill={unlocked ? 'var(--gold)' : 'var(--ink-4)'}
      >
        MILES
      </text>
    </svg>
  );
}

export function MilestoneCard({ state }: { state: MilestoneState }) {
  const { milestone, unlocked, unlockedAt, percentage, milesRemaining } = state;

  return (
    <article className={`milestone milestone--${unlocked ? 'unlocked' : 'locked'}`}>
      <span className="milestone__marker">
        <Marker miles={milestone.requiredMiles} unlocked={unlocked} />
      </span>

      <div className="milestone__body">
        <div className="milestone__head">
          <h3 className="milestone__name">{milestone.name}</h3>
          {unlocked ? <Pill tone="gold">Reached</Pill> : <Pill tone="locked">Ahead</Pill>}
        </div>
        <p className="milestone__desc">{milestone.description}</p>

        {unlocked ? (
          <p className="milestone__desc" style={{ color: 'var(--gold)', fontWeight: 600 }}>
            {unlockedAt ? formatDateLong(unlockedAt) : 'Reached'}
          </p>
        ) : (
          <div className="milestone__progress">
            <ProgressBar value={percentage} thickness="thin" tone="gold" ariaLabel={`${milestone.name} progress`} />
            <p className="milestone__desc">{formatMiles(milesRemaining)} miles to go</p>
          </div>
        )}
      </div>
    </article>
  );
}
