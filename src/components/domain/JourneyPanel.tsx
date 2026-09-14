import { Link } from 'react-router-dom';
import type { CharacterProgress, Destination } from '@/types';
import { CharacterImage } from '@/components/media';
import { Metric, ProgressRing } from './Progress';
import { Skeleton, StatusPill } from '@/components/ui/Primitives';
import { Icon } from '@/components/ui/Icon';
import { formatInt, formatMiles } from '@/lib/format';

/**
 * The most important object on the dashboard: who is next, and how far away.
 *
 * Identity, progress readout and leg statistics are three stacked rows rather than
 * columns competing for a narrow panel, so nothing has to shrink to fit.
 */
export function JourneyPanel({
  leg,
  destination,
}: {
  leg: CharacterProgress;
  destination?: Destination;
}) {
  const hidden = leg.status === 'locked';
  const ready = leg.status === 'ready';

  return (
    <section className="journey" aria-labelledby="journey-title">
      <div className="journey__head">
        <p className="eyebrow">Current journey</p>
        <StatusPill status={leg.status} />
      </div>

      <div className="journey__body">
        <CharacterImage
          character={leg.character}
          destination={destination}
          status={leg.status}
          priority
        />

        <div style={{ minWidth: 0 }}>
          <p className="eyebrow">{destination?.name ?? 'Next encounter'}</p>
          <h2 className="journey__name" id="journey-title">
            {hidden ? 'Next Encounter' : leg.character.name}
          </h2>
          <p className="journey__epithet">
            {hidden ? 'Identity unknown until you get closer.' : leg.character.epithet}
          </p>

          <Link to={`/characters/${leg.character.id}`} className="section__link" style={{ marginTop: 'var(--s-3)' }}>
            {ready ? 'Log the encounter' : 'View encounter'}
            <Icon name="arrowRight" size={14} />
          </Link>
        </div>
      </div>

      <div className="journey__progress">
        <ProgressRing
          value={leg.percentage}
          size={96}
          stroke={8}
          tone={ready ? 'moss' : 'ember'}
          ariaLabel={`${Math.round(leg.percentage * 100)} percent toward the next encounter`}
        />

        <div style={{ minWidth: 0 }}>
          {ready ? (
            <p className="journey__headline">Waiting for you</p>
          ) : (
            <p className="journey__headline">
              <Metric value={leg.milesRemaining} decimals={1} />
              <span className="journey__headlineunit">Miles remaining</span>
            </p>
          )}
          <p className="journey__sub numeric">
            {formatMiles(leg.currentMiles)} of {formatMiles(leg.character.requiredMiles)} miles walked
          </p>
        </div>
      </div>

      <div className="journey__stats">
        <span className="journey__stat">
          <span className="journey__statval">{formatInt(leg.currentSteps)}</span>
          <span className="journey__statlabel">Steps this leg</span>
        </span>
        <span className="journey__stat">
          <span className="journey__statval">{formatInt(leg.requiredSteps)}</span>
          <span className="journey__statlabel">Steps required</span>
        </span>
        <span className="journey__stat">
          <span className="journey__statval">{(leg.percentage * 100).toFixed(1)}%</span>
          <span className="journey__statlabel">Complete</span>
        </span>
      </div>
    </section>
  );
}

export function JourneyPanelSkeleton() {
  return (
    <section className="journey" aria-hidden="true">
      <div className="journey__head">
        <Skeleton width={110} height={10} />
        <Skeleton width={84} height={22} radius={999} />
      </div>
      <div className="journey__body">
        <span className="skeleton" style={{ display: 'block', aspectRatio: '4 / 5', borderRadius: 'var(--r-md)' }} />
        <div className="stack stack--sm">
          <Skeleton width="55%" height={10} />
          <Skeleton width="80%" height={22} />
          <Skeleton width="95%" height={12} />
        </div>
      </div>
      <div className="journey__progress">
        <Skeleton width={96} height={96} radius={999} />
        <div className="stack stack--sm" style={{ flex: 1 }}>
          <Skeleton width="70%" height={26} />
          <Skeleton width="90%" height={12} />
        </div>
      </div>
      <div className="journey__stats">
        <Skeleton width="100%" height={36} />
      </div>
    </section>
  );
}
