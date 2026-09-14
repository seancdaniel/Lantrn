import { useMemo, useState } from 'react';
import { useJourney, useStore } from '@/state/store';
import { useDeferredReady } from '@/hooks';
import { PageHeader, SectionHeader } from '@/components/layout/PageHeader';
import { ActivityChart, ChartSkeleton, type ChartPoint } from '@/components/domain/ActivityChart';
import { StatCard } from '@/components/domain/StatCard';
import { Metric } from '@/components/domain/Progress';
import { LogWalkModal } from '@/components/domain/LogWalkModal';
import { Button } from '@/components/ui/Button';
import { Card, Pill, SegmentedControl } from '@/components/ui/Primitives';
import { hourlyBreakdown } from '@/data/activity';
import {
  addDays,
  daysBetween,
  formatDateLong,
  formatDuration,
  formatInt,
  formatMiles,
  monthShort,
  parseDate,
  weekdayShort,
} from '@/lib/format';

type Range = 'day' | 'week' | 'month' | 'year' | 'all';

const RANGES: { value: Range; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'all', label: 'All time' },
];

export function ActivityPage() {
  const { activities, user, today } = useStore();
  const { totals, records, todayActivity } = useJourney();
  const ready = useDeferredReady('activity');
  const [range, setRange] = useState<Range>('week');
  const [logOpen, setLogOpen] = useState(false);

  const byDate = useMemo(() => new Map(activities.map((a) => [a.date, a])), [activities]);

  const { points, labelEvery, periodSteps, periodLabel } = useMemo((): {
    points: ChartPoint[];
    labelEvery: number;
    periodSteps: number;
    periodLabel: string;
  } => {
    if (range === 'day') {
      const buckets = hourlyBreakdown(todayActivity?.steps ?? 0);
      return {
        points: buckets.map((b) => ({
          key: `h${b.hour}`,
          label: b.hour % 3 === 0 ? `${b.hour}` : '',
          caption: `${String(b.hour).padStart(2, '0')}:00`,
          value: b.steps,
          emphasis: b.steps > 0 && b.hour >= 17,
        })),
        labelEvery: 1,
        periodSteps: todayActivity?.steps ?? 0,
        periodLabel: formatDateLong(today),
      };
    }

    if (range === 'week' || range === 'month') {
      const span = range === 'week' ? 7 : 30;
      const days = Array.from({ length: span }, (_, i) => addDays(today, -(span - 1) + i));
      const pts = days.map((date) => ({
        key: date,
        label: range === 'week' ? weekdayShort(date) : String(parseDate(date).getDate()),
        caption: formatDateLong(date),
        value: byDate.get(date)?.steps ?? 0,
        emphasis: date === today,
      }));
      return {
        points: pts,
        labelEvery: range === 'week' ? 1 : 3,
        periodSteps: pts.reduce((s, p) => s + p.value, 0),
        periodLabel: range === 'week' ? 'Last 7 days' : 'Last 30 days',
      };
    }

    // Year and all-time roll up into calendar months.
    const buckets = new Map<string, { steps: number; date: string }>();
    const cutoff = range === 'year' ? addDays(today, -364) : '0000-01-01';
    for (const a of activities) {
      if (a.date < cutoff) continue;
      const key = a.date.slice(0, 7);
      const current = buckets.get(key) ?? { steps: 0, date: a.date };
      current.steps += a.steps;
      buckets.set(key, current);
    }
    const pts = [...buckets.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, v]) => ({
        key,
        label: monthShort(Number(key.slice(5, 7)) - 1),
        caption: `${monthShort(Number(key.slice(5, 7)) - 1)} ${key.slice(0, 4)}`,
        value: v.steps,
        emphasis: key === today.slice(0, 7),
      }));

    return {
      points: pts,
      labelEvery: 1,
      periodSteps: pts.reduce((s, p) => s + p.value, 0),
      periodLabel: range === 'year' ? 'Last 12 months' : 'Every month on record',
    };
  }, [range, activities, byDate, today, todayActivity]);

  const activeDays = points.filter((p) => p.value > 0).length;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Walking"
        title="Activity"
        description="Every step you have recorded, and what it did to the distance between you and the next encounter."
        actions={
          <Button variant="primary" icon="plus" onClick={() => setLogOpen(true)}>
            Log a walk
          </Button>
        }
      />

      <section aria-labelledby="today-heading">
        <SectionHeader title="Today's activity" id="today-heading" />
        <div className="grid grid--4">
          <StatCard
            label="Steps"
            icon="boot"
            loading={!ready}
            value={<Metric value={todayActivity?.steps ?? 0} />}
          />
          <StatCard
            label="Miles"
            icon="ruler"
            loading={!ready}
            value={<Metric value={todayActivity?.miles ?? 0} decimals={2} />}
          />
          <StatCard
            label="Active time"
            icon="clock"
            loading={!ready}
            value={formatDuration(todayActivity?.activeMinutes ?? 0)}
          />
          <StatCard
            label="Calories"
            icon="flame"
            loading={!ready}
            value={<span className="muted">—</span>}
            foot="Not available from manual entry"
          />
        </div>
      </section>

      <section className="section">
        <Card>
          <div className="row row--between row--wrap" style={{ marginBottom: 'var(--s-5)', gap: 'var(--s-4)' }}>
            <div>
              <p className="card__label">{periodLabel}</p>
              <p className="stat__figure" style={{ marginTop: 'var(--s-2)' }}>
                <span className="stat__value">
                  <Metric value={periodSteps} />
                </span>
                <span className="stat__unit">steps</span>
              </p>
              <p className="muted" style={{ fontSize: 'var(--text-sm)', marginTop: 4 }}>
                {formatMiles(periodSteps / user.stepsPerMile)} miles
                {range !== 'day' ? ` · ${activeDays} active ${activeDays === 1 ? 'period' : 'periods'}` : ''}
              </p>
            </div>
            <SegmentedControl<Range> label="Range" value={range} onChange={setRange} options={RANGES} />
          </div>

          {ready ? (
            <ActivityChart
              data={points}
              average={range === 'day' ? undefined : periodSteps / Math.max(1, points.length)}
              labelEvery={labelEvery}
            />
          ) : (
            <ChartSkeleton />
          )}

          {range !== 'day' ? (
            <p className="field__hint" style={{ marginTop: 'var(--s-4)' }}>
              The dashed line is the average for this range.
            </p>
          ) : null}
        </Card>
      </section>

      <section className="section">
        <SectionHeader title="Personal records" />
        <div className="grid grid--3">
          <StatCard
            label="Longest walk"
            icon="clock"
            loading={!ready}
            size="sm"
            value={formatDuration(records.longestWalk?.activeMinutes ?? 0)}
            foot={
              records.longestWalk
                ? `${formatMiles(records.longestWalk.miles, 2)} mi · ${formatDateLong(records.longestWalk.date)}`
                : undefined
            }
          />
          <StatCard
            label="Most steps in a day"
            icon="boot"
            loading={!ready}
            size="sm"
            value={<Metric value={records.mostStepsInADay?.steps ?? 0} />}
            foot={records.mostStepsInADay ? formatDateLong(records.mostStepsInADay.date) : undefined}
          />
          <StatCard
            label="Most miles in a day"
            icon="ruler"
            loading={!ready}
            size="sm"
            value={<Metric value={records.mostMilesInADay?.miles ?? 0} decimals={2} />}
            foot={records.mostMilesInADay ? formatDateLong(records.mostMilesInADay.date) : undefined}
          />
          <StatCard
            label="Current streak"
            icon="flame"
            loading={!ready}
            size="sm"
            value={<Metric value={records.currentStreak} />}
            unit="days"
            foot={
              records.currentStreak >= records.longestStreak
                ? 'Your best run yet. Do not break it now.'
                : `${records.longestStreak - records.currentStreak} days off your best`
            }
          />
          <StatCard
            label="Longest streak"
            icon="trophy"
            loading={!ready}
            size="sm"
            value={<Metric value={records.longestStreak} />}
            unit="days"
          />
          <StatCard
            label="Walking days"
            icon="calendar"
            loading={!ready}
            size="sm"
            value={<Metric value={totals.walkingDays} />}
            foot={`Out of ${daysBetween(user.createdAt, today) + 1} since you started`}
          />
        </div>
      </section>

      <section className="section">
        <SectionHeader title="Lifetime" />
        <div className="grid grid--4">
          <StatCard label="Total steps" icon="boot" size="sm" value={<Metric value={totals.steps} />} />
          <StatCard label="Total miles" icon="ruler" size="sm" value={<Metric value={totals.miles} decimals={1} />} />
          <StatCard label="Time on foot" icon="clock" size="sm" value={formatDuration(totals.activeMinutes)} />
          <StatCard
            label="Daily average"
            icon="target"
            size="sm"
            value={<Metric value={totals.steps / Math.max(1, totals.walkingDays)} />}
            foot="Across walking days only"
          />
        </div>
        <p className="field__hint" style={{ marginTop: 'var(--s-4)' }}>
          <Pill plain>Stride</Pill> Distance is derived from {formatInt(user.stepsPerMile)} steps per mile. Change
          it in Settings and every figure here recalculates.
        </p>
      </section>

      <LogWalkModal open={logOpen} onClose={() => setLogOpen(false)} />
    </div>
  );
}
