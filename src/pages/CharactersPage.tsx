import { useMemo, useState } from 'react';
import { useJourney, useStore } from '@/state/store';
import { useDeferredReady } from '@/hooks';
import { PageHeader } from '@/components/layout/PageHeader';
import { CharacterCard, CharacterCardSkeleton } from '@/components/domain/CharacterCard';
import { ProgressBar } from '@/components/domain/Progress';
import { Card, EmptyState, Pill, SegmentedControl } from '@/components/ui/Primitives';
import { formatMiles } from '@/lib/format';

type Filter = 'all' | 'in-progress' | 'completed' | 'locked';

export function CharactersPage() {
  const { destinations } = useStore();
  const { progress, destinationProgress, unlockedCount } = useJourney();
  const ready = useDeferredReady('characters');
  const [filter, setFilter] = useState<Filter>('all');
  const [destination, setDestination] = useState<string>('all');

  const visible = useMemo(
    () =>
      progress.filter((entry) => {
        const matchesDestination = destination === 'all' || entry.character.destinationId === destination;
        if (!matchesDestination) return false;
        if (filter === 'all') return true;
        if (filter === 'completed') return entry.status === 'completed' || entry.status === 'ready';
        if (filter === 'in-progress') return entry.status === 'in-progress';
        return entry.status === 'locked';
      }),
    [progress, filter, destination],
  );

  const destinationOf = (id: string) => destinations.find((d) => d.id === id);

  return (
    <div className="page page--wide">
      <PageHeader
        eyebrow="Journey"
        title="Characters"
        description={`${unlockedCount} of ${progress.length} encounters unlocked. Each one sits at the end of a stretch of real walking.`}
        actions={
          <SegmentedControl<Filter>
            label="Filter characters"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'in-progress', label: 'Current' },
              { value: 'completed', label: 'Unlocked' },
              { value: 'locked', label: 'Locked' },
            ]}
          />
        }
      />

      {/* Destination filter, doubling as a progress summary. */}
      <div className="grid grid--auto" style={{ marginBottom: 'var(--s-7)' }}>
        <button
          type="button"
          className={`destcard${destination === 'all' ? ' destcard--active' : ''}`}
          onClick={() => setDestination('all')}
          aria-pressed={destination === 'all'}
        >
          <div className="destcard__head">
            <span className="destcard__index">All</span>
          </div>
          <p className="destcard__name">The whole route</p>
          <p className="destcard__meta">{progress.length} encounters</p>
        </button>

        {destinationProgress.map((dest) => (
          <button
            key={dest.destination.id}
            type="button"
            className={`destcard${destination === dest.destination.id ? ' destcard--active' : ''}`}
            onClick={() => setDestination(dest.destination.id)}
            aria-pressed={destination === dest.destination.id}
          >
            <div className="destcard__head">
              <span className="destcard__index">{String(dest.index + 1).padStart(2, '0')}</span>
              {dest.status === 'completed' ? (
                <Pill tone="complete">Complete</Pill>
              ) : dest.status === 'in-progress' ? (
                <Pill tone="progress">Here now</Pill>
              ) : (
                <Pill tone="locked">Ahead</Pill>
              )}
            </div>
            <p className="destcard__name">{dest.destination.name}</p>
            <p className="destcard__meta">
              {dest.unlockedCount}/{dest.characters.length} encounters ·{' '}
              {formatMiles(dest.endMiles - dest.startMiles)} mi
            </p>
            <div className="destcard__bar">
              <ProgressBar
                value={dest.percentage}
                thickness="thin"
                tone={dest.status === 'completed' ? 'moss' : 'ember'}
                ariaLabel={`${dest.destination.name} progress`}
              />
            </div>
          </button>
        ))}
      </div>

      {!ready ? (
        <div className="grid grid--4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CharacterCardSkeleton key={i} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon="characters"
          title="Nobody here."
          body="No encounters match that combination. Try a different filter, or walk further and change the answer."
        />
      ) : (
        <>
          {destination !== 'all' ? (
            <Card sunken style={{ marginBottom: 'var(--s-5)' }}>
              <p className="muted" style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
                {destinationOf(destination)?.description}
              </p>
            </Card>
          ) : null}

          <div className="grid grid--4">
            {visible.map((entry) => (
              <CharacterCard
                key={entry.character.id}
                entry={entry}
                destination={destinationOf(entry.character.destinationId)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
