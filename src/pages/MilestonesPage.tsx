import { useJourney } from '@/state/store';
import { PageHeader, SectionHeader } from '@/components/layout/PageHeader';
import { MilestoneCard } from '@/components/domain/MilestoneCard';
import { Metric, ProgressBar } from '@/components/domain/Progress';
import { Card, Pill } from '@/components/ui/Primitives';
import { formatMiles } from '@/lib/format';

export function MilestonesPage() {
  const { milestoneStates, nextMilestone, totals } = useJourney();
  const reached = milestoneStates.filter((m) => m.unlocked);
  const ahead = milestoneStates.filter((m) => !m.unlocked);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Journey"
        title="Milestones"
        description="Distance markers rather than badges. Each one is a place your own feet took you past."
        actions={<Pill tone="gold">{reached.length} of {milestoneStates.length} reached</Pill>}
      />

      {nextMilestone ? (
        <Card sunken>
          <div className="row row--between row--wrap" style={{ gap: 'var(--s-5)' }}>
            <div>
              <p className="card__label">Next marker</p>
              <p className="stat__figure" style={{ marginTop: 'var(--s-2)' }}>
                <span className="stat__value">
                  <Metric value={nextMilestone.milestone.requiredMiles} />
                </span>
                <span className="stat__unit">miles</span>
              </p>
              <p className="muted" style={{ fontSize: 'var(--text-sm)', marginTop: 4 }}>
                {nextMilestone.milestone.name} — {formatMiles(nextMilestone.milesRemaining)} miles out.
              </p>
            </div>
            <div style={{ minWidth: 260, flex: 1, maxWidth: 460 }}>
              <div className="row row--between" style={{ marginBottom: 8 }}>
                <span className="muted numeric" style={{ fontSize: 'var(--text-xs)' }}>
                  {formatMiles(totals.miles)} mi
                </span>
                <span className="charcard__pct">{Math.round(nextMilestone.percentage * 100)}%</span>
              </div>
              <ProgressBar
                value={nextMilestone.percentage}
                thickness="thick"
                tone="gold"
                ariaLabel="Progress to next milestone"
              />
            </div>
          </div>
        </Card>
      ) : null}

      <section className="section">
        <SectionHeader title="Reached" />
        <div className="grid grid--2">
          {[...reached].reverse().map((state) => (
            <MilestoneCard key={state.milestone.id} state={state} />
          ))}
        </div>
      </section>

      {ahead.length > 0 ? (
        <section className="section">
          <SectionHeader title="Still ahead" />
          <div className="grid grid--2">
            {ahead.map((state) => (
              <MilestoneCard key={state.milestone.id} state={state} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
