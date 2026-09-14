import type { Activity } from '@/types';
import { formatDateLong, formatInt, formatMiles, formatDuration, weekdayName } from '@/lib/format';
import { Icon } from '@/components/ui/Icon';
import { Skeleton } from '@/components/ui/Primitives';

export interface TimelineEntry {
  activity: Activity;
  /** Distance still owed on the leg that was current on that day. */
  remainingAfter: number;
  legName: string | null;
  unlocked?: string | null;
}

/** A walking journal rather than a log table: one day, one entry, in the user's voice. */
export function ActivityTimeline({ entries, today }: { entries: TimelineEntry[]; today: string }) {
  return (
    <ol className="timeline">
      {entries.map(({ activity, remainingAfter, legName, unlocked }) => {
        const rest = activity.steps === 0;
        return (
          <li
            key={activity.id}
            className={[
              'tl-item',
              unlocked ? 'tl-item--strong' : '',
              rest ? 'tl-item--rest' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <div className="tl-item__head">
              <div>
                <p className="tl-item__day">
                  {activity.date === today ? 'Today' : weekdayName(activity.date)}
                </p>
                <p className="tl-item__date">{formatDateLong(activity.date)}</p>
              </div>
              {rest ? <span className="pill pill--locked">Rest day</span> : null}
            </div>

            {rest ? (
              <p className="tl-item__note muted">No walking recorded. The route waits.</p>
            ) : (
              <>
                <div className="tl-item__stats">
                  <span className="tl-item__stat">
                    <span className="tl-item__statval numeric">{formatInt(activity.steps)}</span>
                    <span className="tl-item__statlabel">Steps</span>
                  </span>
                  <span className="tl-item__stat">
                    <span className="tl-item__statval numeric">{formatMiles(activity.miles, 2)}</span>
                    <span className="tl-item__statlabel">Miles</span>
                  </span>
                  <span className="tl-item__stat">
                    <span className="tl-item__statval numeric">{formatDuration(activity.activeMinutes)}</span>
                    <span className="tl-item__statlabel">Active time</span>
                  </span>
                </div>

                {unlocked ? (
                  <p className="tl-item__note">
                    <Icon name="sparkle" size={14} />
                    <span>
                      Encounter unlocked — <b>{unlocked}</b>
                    </span>
                  </p>
                ) : legName ? (
                  <p className="tl-item__note">
                    <Icon name="arrowRight" size={14} />
                    <span>
                      <b>+{formatMiles(activity.miles, 2)} miles</b> toward {legName}
                      {remainingAfter > 0 ? ` · ${formatMiles(remainingAfter)} to go` : ''}
                    </span>
                  </p>
                ) : null}
              </>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function TimelineSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <ol className="timeline" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <li className="tl-item" key={i}>
          <Skeleton width={90} height={9} />
          <div style={{ height: 8 }} />
          <Skeleton width={190} height={17} radius={5} />
          <div style={{ height: 14 }} />
          <Skeleton width="70%" height={12} />
        </li>
      ))}
    </ol>
  );
}
