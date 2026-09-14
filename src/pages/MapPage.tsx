import { useJourney } from '@/state/store';
import { useDeferredReady } from '@/hooks';
import { PageHeader, SectionHeader } from '@/components/layout/PageHeader';
import { AdventureMap } from '@/components/domain/AdventureMap';
import { ProgressBar } from '@/components/domain/Progress';
import { Card, Pill, Skeleton } from '@/components/ui/Primitives';
import { ButtonLink } from '@/components/ui/Button';
import { formatMiles } from '@/lib/format';

export function MapPage() {
  const { progress, destinationProgress, totals, routeMiles, routePercentage, leg } = useJourney();
  const ready = useDeferredReady('map');

  return (
    <div className="page page--wide">
      <PageHeader
        eyebrow="Journey"
        title="Adventure map"
        description="Five destinations, twenty encounters, one continuous route. Your marker sits exactly where your mileage puts it."
        actions={
          <div className="row" style={{ gap: 'var(--s-2)' }}>
            <Pill plain>{formatMiles(totals.miles)} mi travelled</Pill>
            <Pill plain>{formatMiles(routeMiles - totals.miles)} mi ahead</Pill>
          </div>
        }
      />

      {ready ? (
        <AdventureMap
          progress={progress}
          destinations={destinationProgress}
          totalMiles={totals.miles}
          routeMiles={routeMiles}
        />
      ) : (
        <Skeleton height={0} radius="var(--r-2xl)" className="map" />
      )}

      <p className="field__hint" style={{ marginTop: 'var(--s-3)' }}>
        Select any point on the route to see who is there. Locked encounters stay unnamed until you reach them.
      </p>

      <section className="section">
        <SectionHeader
          title="Destinations"
          action={
            leg ? (
              <ButtonLink to={`/characters/${leg.character.id}`} size="sm" variant="quiet" iconAfter="arrowRight">
                Current leg
              </ButtonLink>
            ) : undefined
          }
        />

        <div className="stack">
          {destinationProgress.map((dest) => (
            <Card key={dest.destination.id} className={dest.status === 'in-progress' ? 'destcard--active' : ''}>
              <div className="grid grid--split" style={{ gap: 'var(--s-6)', alignItems: 'center' }}>
                <div>
                  <div className="row row--between row--wrap" style={{ gap: 'var(--s-3)' }}>
                    <div className="row" style={{ gap: 'var(--s-4)' }}>
                      <span className="destcard__index">{String(dest.index + 1).padStart(2, '0')}</span>
                      <div>
                        <h3 className="destcard__name">{dest.destination.name}</h3>
                        <p className="muted" style={{ fontSize: 'var(--text-xs)' }}>
                          {dest.destination.subtitle}
                        </p>
                      </div>
                    </div>
                    {dest.status === 'completed' ? (
                      <Pill tone="complete">Complete</Pill>
                    ) : dest.status === 'in-progress' ? (
                      <Pill tone="progress">You are here</Pill>
                    ) : (
                      <Pill tone="locked">Ahead</Pill>
                    )}
                  </div>

                  <p className="muted" style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--s-4)', lineHeight: 1.6 }}>
                    {dest.destination.description}
                  </p>
                </div>

                <div>
                  <div className="row row--between" style={{ marginBottom: 8 }}>
                    <span className="muted numeric" style={{ fontSize: 'var(--text-xs)' }}>
                      {formatMiles(dest.startMiles)} – {formatMiles(dest.endMiles)} mi
                    </span>
                    <span className="charcard__pct">{Math.round(dest.percentage * 100)}%</span>
                  </div>
                  <ProgressBar
                    value={dest.percentage}
                    tone={dest.status === 'completed' ? 'moss' : 'ember'}
                    ariaLabel={`${dest.destination.name} progress`}
                  />

                  <ul className="stack stack--sm" style={{ marginTop: 'var(--s-4)' }}>
                    {dest.characters.map((c) => (
                      <li key={c.character.id} className="row row--between">
                        <span className="row" style={{ gap: 10, minWidth: 0 }}>
                          <span
                            className="map__swatch"
                            style={{
                              background:
                                c.status === 'completed' || c.status === 'ready'
                                  ? 'var(--ember)'
                                  : c.status === 'in-progress'
                                    ? 'var(--surface)'
                                    : 'var(--line-strong)',
                              border: c.status === 'in-progress' ? '2px solid var(--ember)' : undefined,
                            }}
                          />
                          <span style={{ fontSize: 'var(--text-sm)' }}>
                            {c.status === 'locked' ? 'Unidentified' : c.character.name}
                          </span>
                        </span>
                        <span className="muted numeric" style={{ fontSize: 'var(--text-xs)' }}>
                          {formatMiles(c.character.requiredMiles)} mi
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="section">
        <Card sunken>
          <div className="row row--between row--wrap" style={{ gap: 'var(--s-4)' }}>
            <div>
              <p className="card__label">Route total</p>
              <p className="stat__figure" style={{ marginTop: 'var(--s-2)' }}>
                <span className="stat__value">{formatMiles(routeMiles)}</span>
                <span className="stat__unit">miles, end to end</span>
              </p>
            </div>
            <div style={{ minWidth: 260, flex: 1, maxWidth: 480 }}>
              <ProgressBar value={routePercentage} thickness="thick" ariaLabel="Route completion" />
              <p className="muted" style={{ fontSize: 'var(--text-xs)', marginTop: 8 }}>
                {formatMiles(routeMiles - totals.miles)} miles left. At your current average that is a matter of
                months, not years.
              </p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
