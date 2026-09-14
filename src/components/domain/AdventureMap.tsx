import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { CharacterProgress, Destination, DestinationProgress } from '@/types';
import { MAP_VIEWBOX, ROUTE_STOPS, smoothPath } from '@/lib/svg';
import { formatMiles } from '@/lib/format';
import { Pill, StatusPill } from '@/components/ui/Primitives';
import { ButtonLink } from '@/components/ui/Button';
import { usePrefersReducedMotion } from '@/hooks';

interface Props {
  progress: CharacterProgress[];
  destinations: DestinationProgress[];
  totalMiles: number;
  routeMiles: number;
}

/**
 * The route as an illustrated map rather than a chart. The travelled portion is
 * drawn along the real curve using the browser's own path geometry, so the marker
 * sits exactly where the mileage puts it.
 */
export function AdventureMap({ progress, destinations, totalMiles, routeMiles }: Props) {
  const uid = useId().replace(/:/g, '');
  const pathRef = useRef<SVGPathElement>(null);
  const [length, setLength] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const reduced = usePrefersReducedMotion();

  const stops = useMemo(
    () => progress.map((entry, i) => ({ entry, point: ROUTE_STOPS[i % ROUTE_STOPS.length] })),
    [progress],
  );

  const d = useMemo(() => smoothPath(stops.map((s) => s.point)), [stops]);
  const fraction = routeMiles === 0 ? 0 : Math.min(1, totalMiles / routeMiles);

  useEffect(() => {
    if (pathRef.current) setLength(pathRef.current.getTotalLength());
  }, [d]);

  const traveller = useMemo(() => {
    if (!pathRef.current || length === 0) return null;
    return pathRef.current.getPointAtLength(length * fraction);
  }, [length, fraction]);

  const byDestination = useMemo(() => {
    const map = new Map<string, { destination: Destination; points: typeof stops; state: DestinationProgress }>();
    for (const state of destinations) {
      map.set(state.destination.id, {
        destination: state.destination,
        state,
        points: stops.filter((s) => s.entry.character.destinationId === state.destination.id),
      });
    }
    return [...map.values()].filter((group) => group.points.length > 0);
  }, [destinations, stops]);

  const active = selected ? progress.find((p) => p.character.id === selected) ?? null : null;
  const activeDestination = active
    ? destinations.find((dp) => dp.destination.id === active.character.destinationId) ?? null
    : null;

  return (
    <div className="map grain">
      <svg
        className="map__svg"
        viewBox={`0 0 ${MAP_VIEWBOX.w} ${MAP_VIEWBOX.h}`}
        role="group"
        aria-label="Adventure map"
      >
        <defs>
          {byDestination.map(({ destination }) => (
            <radialGradient key={destination.id} id={`region-${uid}-${destination.id}`} cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor={destination.palette.glow} stopOpacity="0.34" />
              <stop offset="0.62" stopColor={destination.palette.mid} stopOpacity="0.16" />
              <stop offset="1" stopColor={destination.palette.deep} stopOpacity="0" />
            </radialGradient>
          ))}
          <filter id={`soft-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>

        {/* Regions ------------------------------------------------------- */}
        {byDestination.map(({ destination, points, state }) => {
          const xs = points.map((p) => p.point.x);
          const ys = points.map((p) => p.point.y);
          const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
          const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
          const rx = Math.max(120, (Math.max(...xs) - Math.min(...xs)) / 2 + 96);
          const ry = Math.max(110, (Math.max(...ys) - Math.min(...ys)) / 2 + 92);
          const dim = state.status === 'locked';

          return (
            <g key={destination.id} opacity={dim ? 0.45 : 1}>
              <ellipse
                cx={cx}
                cy={cy}
                rx={rx}
                ry={ry}
                fill={`url(#region-${uid}-${destination.id})`}
                filter={`url(#soft-${uid})`}
              />
              <ellipse
                cx={cx}
                cy={cy}
                rx={rx * 0.74}
                ry={ry * 0.74}
                fill="none"
                stroke={destination.palette.mid}
                strokeOpacity="0.22"
                strokeDasharray="3 9"
              />
              <text className="map__desteyebrow" x={cx} y={cy - ry + 26} textAnchor="middle">
                DESTINATION {String(state.index + 1).padStart(2, '0')}
              </text>
              <text className="map__destlabel" x={cx} y={cy - ry + 48} textAnchor="middle">
                {destination.name}
              </text>
            </g>
          );
        })}

        {/* Route --------------------------------------------------------- */}
        <path ref={pathRef} d={d} className="map__route map__route--todo" />
        {length > 0 ? (
          <>
            <path
              d={d}
              className="map__route map__route--done"
              strokeDasharray={`${length * fraction} ${length}`}
            />
            {/* Three travellers drifting the stretch already walked. */}
            {!reduced
              ? [0, 1, 2].map((i) => (
                  <circle key={i} r="3.2" fill="var(--ember)" opacity="0.5">
                    <animateMotion
                      dur="9s"
                      begin={`${i * 3}s`}
                      repeatCount="indefinite"
                      path={d}
                      keyPoints={`0;${Math.max(0.001, fraction)}`}
                      keyTimes="0;1"
                      calcMode="linear"
                    />
                  </circle>
                ))
              : null}
          </>
        ) : null}

        {/* Encounters ---------------------------------------------------- */}
        {stops.map(({ entry, point }) => {
          const done = entry.status === 'completed' || entry.status === 'ready';
          const inProgress = entry.status === 'in-progress';
          const fill = done ? 'var(--ember)' : inProgress ? 'var(--surface)' : 'var(--surface-sunken)';
          const stroke = done ? 'var(--ember)' : inProgress ? 'var(--ember)' : 'var(--line-strong)';

          return (
            <g
              key={entry.character.id}
              className="map__node"
              transform={`translate(${point.x} ${point.y})`}
              tabIndex={0}
              role="button"
              aria-label={`${entry.status === 'locked' ? 'Locked encounter' : entry.character.name}, ${Math.round(entry.percentage * 100)} percent`}
              onClick={() => setSelected(entry.character.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelected(entry.character.id);
                }
              }}
            >
              <circle r="16" fill="transparent" />
              <circle
                className="map__nodering"
                r={inProgress ? 11 : 8}
                fill={fill}
                stroke={stroke}
                strokeWidth={inProgress ? 3 : 2}
              />
              {done ? <circle r="3" fill="var(--on-accent)" /> : null}
              <text className="map__label" y={-22} textAnchor="middle">
                {entry.status === 'locked' ? '—' : entry.character.name.replace('The ', '')}
              </text>
            </g>
          );
        })}

        {/* Traveller ----------------------------------------------------- */}
        {traveller ? (
          <g className="map__traveller" transform={`translate(${traveller.x} ${traveller.y})`}>
            <circle r="11" fill="var(--surface)" stroke="var(--ink)" strokeWidth="2.5" />
            <circle r="4.5" fill="var(--ember)" />
          </g>
        ) : null}
      </svg>

      {active ? (
        <div className="map__panel">
          <div className="map__panelhead">
            <div>
              <p className="eyebrow">{activeDestination?.destination.name}</p>
              <p className="journey__name">
                {active.status === 'locked' ? 'Not yet identified' : active.character.name}
              </p>
            </div>
            <StatusPill status={active.status} />
          </div>

          <p className="muted" style={{ fontSize: 'var(--text-sm)', lineHeight: 1.55 }}>
            {active.status === 'locked'
              ? 'Reach this point on the route and you will find out who is waiting.'
              : active.character.description}
          </p>

          <div className="row row--wrap" style={{ gap: 'var(--s-2)' }}>
            <Pill plain>{formatMiles(active.character.requiredMiles)} mi leg</Pill>
            <Pill plain>
              {active.status === 'locked'
                ? `Starts at ${formatMiles(active.startMiles)} mi`
                : `${formatMiles(active.currentMiles)} / ${formatMiles(active.character.requiredMiles)} mi`}
            </Pill>
          </div>

          <div className="row row--wrap" style={{ gap: 'var(--s-2)' }}>
            <ButtonLink to={`/characters/${active.character.id}`} size="sm" variant="primary" iconAfter="arrowRight">
              Open encounter
            </ButtonLink>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
        </div>
      ) : null}

      <div className="map__legend">
        <span className="map__legenditem">
          <span className="map__swatch" style={{ background: 'var(--ember)' }} />
          Reached
        </span>
        <span className="map__legenditem">
          <span
            className="map__swatch"
            style={{ background: 'var(--surface)', border: '2px solid var(--ember)' }}
          />
          Current leg
        </span>
        <span className="map__legenditem">
          <span
            className="map__swatch"
            style={{ background: 'var(--surface-sunken)', border: '1px solid var(--line-strong)' }}
          />
          Ahead
        </span>
        <span className="spacer" />
        <span className="map__legenditem numeric">
          {formatMiles(totalMiles)} of {formatMiles(routeMiles)} mi travelled
        </span>
        <Link to="/characters" className="section__link">
          All encounters
        </Link>
      </div>
    </div>
  );
}
