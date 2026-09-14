import { useMemo, useState } from 'react';
import { useJourney, useStore } from '@/state/store';
import { useDeferredReady } from '@/hooks';
import { PageHeader } from '@/components/layout/PageHeader';
import { ActivityTimeline, TimelineSkeleton, type TimelineEntry } from '@/components/domain/ActivityTimeline';
import { Button } from '@/components/ui/Button';
import { Card, EmptyState, SegmentedControl } from '@/components/ui/Primitives';
import { LogWalkModal } from '@/components/domain/LogWalkModal';
import { legThresholds } from '@/lib/progress';
import { formatMiles, formatMonthYear } from '@/lib/format';

type Filter = 'all' | 'walked' | 'unlocks';

const PAGE_SIZE = 21;

export function HistoryPage() {
  const { activities, characters, today } = useStore();
  const { totals } = useJourney();
  const ready = useDeferredReady('history');
  const [filter, setFilter] = useState<Filter>('all');
  const [shown, setShown] = useState(PAGE_SIZE);
  const [logOpen, setLogOpen] = useState(false);

  /**
   * Walk the history forward once, tracking the running total, so each day can say
   * which leg it was contributing to and whether it happened to finish one.
   */
  const entries = useMemo<TimelineEntry[]>(() => {
    const legs = legThresholds(characters);
    const ordered = [...activities].sort((a, b) => a.date.localeCompare(b.date));
    let running = 0;
    const rows: TimelineEntry[] = [];

    for (const activity of ordered) {
      const before = running;
      running += activity.miles;

      const crossed = legs.find((l) => before < l.endMiles && running >= l.endMiles);
      const current = legs.find((l) => running > l.startMiles && running < l.endMiles);

      rows.push({
        activity,
        legName: current?.character.name ?? null,
        remainingAfter: current ? current.endMiles - running : 0,
        unlocked: crossed?.character.name ?? null,
      });
    }

    return rows.reverse();
  }, [activities, characters]);

  const filtered = useMemo(() => {
    if (filter === 'walked') return entries.filter((e) => e.activity.steps > 0);
    if (filter === 'unlocks') return entries.filter((e) => e.unlocked);
    return entries;
  }, [entries, filter]);

  const visible = filtered.slice(0, shown);

  const grouped = useMemo(() => {
    const groups: { month: string; rows: TimelineEntry[] }[] = [];
    for (const row of visible) {
      const month = formatMonthYear(row.activity.date);
      const last = groups[groups.length - 1];
      if (last && last.month === month) last.rows.push(row);
      else groups.push({ month, rows: [row] });
    }
    return groups;
  }, [visible]);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Walking"
        title="History"
        description={`${formatMiles(totals.miles)} miles, one day at a time. The whole record, newest first.`}
        actions={
          <SegmentedControl<Filter>
            label="Filter history"
            value={filter}
            onChange={(next) => {
              setFilter(next);
              setShown(PAGE_SIZE);
            }}
            options={[
              { value: 'all', label: 'Everything' },
              { value: 'walked', label: 'Walked' },
              { value: 'unlocks', label: 'Unlocks' },
            ]}
          />
        }
      />

      {!ready ? (
        <Card>
          <TimelineSkeleton rows={5} />
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="Nothing on record yet."
          body="Once you log a walk it lands here, with the miles it added and how much of the leg was left afterwards."
          action={
            <Button variant="accent" icon="plus" onClick={() => setLogOpen(true)}>
              Start walking
            </Button>
          }
        />
      ) : (
        <div className="stack stack--lg">
          {grouped.map((group) => (
            <section key={group.month}>
              <div className="section__head" style={{ marginBottom: 'var(--s-2)' }}>
                <h2 className="section__title">{group.month}</h2>
                <span className="muted numeric" style={{ fontSize: 'var(--text-xs)' }}>
                  {formatMiles(group.rows.reduce((s, r) => s + r.activity.miles, 0))} mi
                </span>
              </div>
              <ActivityTimeline entries={group.rows} today={today} />
            </section>
          ))}

          {shown < filtered.length ? (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Button variant="quiet" onClick={() => setShown((s) => s + PAGE_SIZE)} iconAfter="chevronDown">
                Show earlier days ({filtered.length - shown} left)
              </Button>
            </div>
          ) : (
            <p className="muted" style={{ textAlign: 'center', fontSize: 'var(--text-sm)' }}>
              That is the whole record. It started with one day like any other.
            </p>
          )}
        </div>
      )}

      <LogWalkModal open={logOpen} onClose={() => setLogOpen(false)} />
    </div>
  );
}
