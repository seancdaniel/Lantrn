import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useJourney, useStore } from '@/state/store';
import { useDeferredReady, useDocumentMeta } from '@/hooks';
import { JourneyPanel, JourneyPanelSkeleton } from '@/components/domain/JourneyPanel';
import { StatCard } from '@/components/domain/StatCard';
import { Metric, ProgressBar } from '@/components/domain/Progress';
import { CharacterCard, CharacterCardSkeleton } from '@/components/domain/CharacterCard';
import { ActivityChart, ChartSkeleton } from '@/components/domain/ActivityChart';
import { LogWalkModal } from '@/components/domain/LogWalkModal';
import { Button } from '@/components/ui/Button';
import { Card, EmptyState, Pill } from '@/components/ui/Primitives';
import { Icon } from '@/components/ui/Icon';
import { SectionHeader } from '@/components/layout/PageHeader';
import { journeyMood } from '@/lib/progress';
import {
  addDays,
  formatDuration,
  formatInt,
  formatMiles,
  weekdayShort,
} from '@/lib/format';

export function Dashboard() {
  const { user, activities, destinations, today } = useStore();
  const journey = useJourney();
  const ready = useDeferredReady('dashboard');
  const [logOpen, setLogOpen] = useState(false);

  useDocumentMeta(
    'Lantrn — Every mile brings you closer',
    'Your adventure so far: miles walked, steps taken, and the character encounter waiting at the end of this leg.',
  );

  const { totals, leg, records, routePercentage, routeMiles, todayActivity } = journey;
  const todaySteps = todayActivity?.steps ?? 0;
  const mood = journeyMood(leg, todaySteps);

  const week = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => addDays(today, -6 + i));
    return days.map((date) => {
      const match = activities.find((a) => a.date === date);
      return {
        key: date,
        label: weekdayShort(date),
        caption: date === today ? 'Today' : weekdayShort(date),
        value: match?.steps ?? 0,
        emphasis: date === today,
      };
    });
  }, [activities, today]);

  const weekTotal = week.reduce((sum, d) => sum + d.value, 0);
  const upNext = useMemo(
    () => journey.progress.filter((p) => p.status === 'in-progress' || p.status === 'ready' || p.status === 'locked').slice(0, 4),
    [journey.progress],
  );

  const destinationOf = (id: string) => destinations.find((d) => d.id === id);

  return (
    <div className="page page--wide">
      {/* Hero ------------------------------------------------------------ */}
      <section className="hero">
        <div className="hero__inner">
          <div>
            <p className="eyebrow">Your adventure so far</p>
            <h1 className="hero__mood">{mood.headline}</h1>
            <p className="hero__moodsub">{mood.sub}</p>

            <div className="hero__figure">
              <span className="hero__number">
                <Metric value={totals.miles} duration={1400} />
              </span>
              <span className="hero__unit">Miles walked</span>
            </div>

            <div className="hero__steps">
              <span className="hero__rule" />
              <span>
                <b className="numeric">
                  <Metric value={totals.steps} duration={1600} />
                </b>{' '}
                steps
              </span>
            </div>

            <div className="hero__meta">
              <Pill plain>
                <Icon name="flame" size={13} /> {records.currentStreak}-day streak
              </Pill>
              <Pill plain>
                <Icon name="compass" size={13} /> {formatMiles(routePercentage * 100)}% of the route
              </Pill>
              <Pill plain>
                <Icon name="characters" size={13} /> {journey.unlockedCount} of {journey.progress.length} encounters
              </Pill>
            </div>

            <div className="hero__actions">
              <Button variant="primary" icon="plus" onClick={() => setLogOpen(true)}>
                Log a walk
              </Button>
              <Link to="/map" className="btn">
                <Icon name="map" size={16} />
                Open the map
              </Link>
            </div>
          </div>

          {ready && leg ? <JourneyPanel leg={leg} destination={destinationOf(leg.character.destinationId)} /> : <JourneyPanelSkeleton />}
        </div>
      </section>

      {/* Today ----------------------------------------------------------- */}
      <section className="section">
        <SectionHeader
          title="Today"
          action={
            <Link to="/activity" className="section__link">
              Full activity <Icon name="arrowRight" size={14} />
            </Link>
          }
        />

        {todaySteps === 0 ? (
          <EmptyState
            title="No miles yet today."
            body="Your adventure starts with the first step. The route is not going to walk itself."
            action={
              <Button variant="accent" icon="plus" onClick={() => setLogOpen(true)}>
                Start walking
              </Button>
            }
          />
        ) : (
          <div className="grid grid--4">
            <StatCard
              label="Steps"
              icon="boot"
              loading={!ready}
              value={<Metric value={todaySteps} />}
              foot={`${formatInt(Math.max(0, todaySteps - 10000))} over a 10k day`}
            />
            <StatCard
              label="Miles"
              icon="ruler"
              loading={!ready}
              value={<Metric value={todayActivity?.miles ?? 0} decimals={2} />}
              foot={`${formatMiles((todayActivity?.miles ?? 0) / Math.max(1, leg?.character.requiredMiles ?? 1) * 100)}% of this leg, today alone`}
            />
            <StatCard
              label="Active time"
              icon="clock"
              loading={!ready}
              value={formatDuration(todayActivity?.activeMinutes ?? 0)}
              foot="Estimated from pace"
            />
            <StatCard
              label="Calories"
              icon="flame"
              loading={!ready}
              value={<span className="muted">—</span>}
              foot="Manual entry cannot measure this"
            />
          </div>
        )}
      </section>

      {/* Week + route ----------------------------------------------------- */}
      <section className="section">
        <div className="grid grid--split">
          <Card>
            <div className="row row--between" style={{ marginBottom: 'var(--s-5)' }}>
              <div>
                <p className="card__label">Last seven days</p>
                <p className="stat__figure" style={{ marginTop: 'var(--s-2)' }}>
                  <span className="stat__value stat__value--sm">
                    <Metric value={weekTotal} />
                  </span>
                  <span className="stat__unit">steps</span>
                </p>
              </div>
              <Pill plain>{formatMiles(weekTotal / user.stepsPerMile)} mi</Pill>
            </div>
            {ready ? <ActivityChart data={week} average={weekTotal / 7} /> : <ChartSkeleton />}
          </Card>

          <Card>
            <p className="card__label">Route progress</p>
            <p className="stat__figure" style={{ marginTop: 'var(--s-2)' }}>
              <span className="stat__value">
                <Metric value={routePercentage * 100} decimals={1} />%
              </span>
            </p>
            <p className="muted" style={{ fontSize: 'var(--text-sm)', marginTop: 6 }}>
              {formatMiles(totals.miles)} of {formatMiles(routeMiles)} miles, end to end.
            </p>

            <div style={{ marginTop: 'var(--s-5)' }}>
              <ProgressBar
                value={routePercentage}
                thickness="thick"
                ticks={journey.destinationProgress.map((d) => d.endMiles / routeMiles)}
                ariaLabel="Overall route progress"
              />
            </div>

            <ul className="stack stack--sm" style={{ marginTop: 'var(--s-5)' }}>
              {journey.destinationProgress.map((dest) => (
                <li key={dest.destination.id} className="row row--between">
                  <span className="row" style={{ gap: 10, minWidth: 0 }}>
                    <span
                      className="map__swatch"
                      style={{
                        background:
                          dest.status === 'completed'
                            ? 'var(--moss)'
                            : dest.status === 'in-progress'
                              ? 'var(--ember)'
                              : 'var(--line-strong)',
                      }}
                    />
                    <span style={{ fontSize: 'var(--text-sm)' }}>{dest.destination.name}</span>
                  </span>
                  <span className="muted numeric" style={{ fontSize: 'var(--text-xs)' }}>
                    {dest.unlockedCount}/{dest.characters.length}
                  </span>
                </li>
              ))}
            </ul>

            <Link to="/map" className="section__link" style={{ marginTop: 'var(--s-5)' }}>
              See the whole route <Icon name="arrowRight" size={14} />
            </Link>
          </Card>
        </div>
      </section>

      {/* Up next ---------------------------------------------------------- */}
      <section className="section">
        <SectionHeader
          title="Coming up"
          action={
            <Link to="/characters" className="section__link">
              All characters <Icon name="arrowRight" size={14} />
            </Link>
          }
        />
        <div className="grid grid--4 grid--swipe">
          {ready
            ? upNext.map((entry) => (
                <CharacterCard
                  key={entry.character.id}
                  entry={entry}
                  destination={destinationOf(entry.character.destinationId)}
                />
              ))
            : Array.from({ length: 4 }).map((_, i) => <CharacterCardSkeleton key={i} />)}
        </div>
      </section>

      <LogWalkModal open={logOpen} onClose={() => setLogOpen(false)} />
    </div>
  );
}
