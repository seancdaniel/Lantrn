import { useMemo, useState } from 'react';
import { formatInt } from '@/lib/format';
import { usePrefersReducedMotion } from '@/hooks';

export interface ChartPoint {
  key: string;
  label: string;
  value: number;
  caption?: string;
  emphasis?: boolean;
}

const W = 760;
const H = 250;
const PAD_L = 48;
const PAD_R = 8;
const PAD_T = 14;
const PAD_B = 30;

function niceCeiling(max: number) {
  if (max <= 0) return 1000;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const step = magnitude / 2;
  return Math.ceil(max / step) * step;
}

/**
 * One chart for every range. Bars stay bars whether the bucket is an hour or a
 * month, so switching range never re-teaches the reader how to look at it.
 */
export function ActivityChart({
  data,
  unit = 'steps',
  average,
  labelEvery = 1,
}: {
  data: ChartPoint[];
  unit?: string;
  /** Draws the dashed reference line, e.g. the period average. */
  average?: number;
  labelEvery?: number;
}) {
  const reduced = usePrefersReducedMotion();
  const [hover, setHover] = useState<number | null>(null);

  const { bars, top, gridLines } = useMemo(() => {
    const max = Math.max(...data.map((d) => d.value), 1);
    const ceiling = niceCeiling(max);
    const innerW = W - PAD_L - PAD_R;
    const innerH = H - PAD_T - PAD_B;
    const slot = innerW / Math.max(1, data.length);
    const width = Math.max(2, Math.min(slot * 0.62, 34));

    return {
      top: ceiling,
      gridLines: [0, 0.5, 1].map((f) => ({ f, y: PAD_T + innerH * (1 - f), value: ceiling * f })),
      bars: data.map((point, i) => {
        const h = (point.value / ceiling) * innerH;
        return {
          ...point,
          i,
          x: PAD_L + slot * i + slot / 2,
          w: width,
          h: Math.max(point.value > 0 ? 2 : 0, h),
          y: PAD_T + innerH - Math.max(point.value > 0 ? 2 : 0, h),
        };
      }),
    };
  }, [data]);

  const active = hover === null ? null : bars[hover];
  const avgY = average ? PAD_T + (H - PAD_T - PAD_B) * (1 - average / top) : null;

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="presentation">
        {gridLines.map((line) => (
          <g key={line.f}>
            <line className="chart__grid" x1={PAD_L} x2={W - PAD_R} y1={line.y} y2={line.y} />
            <text className="chart__axis" x={0} y={line.y + 4}>
              {line.value >= 1000 ? `${Math.round(line.value / 1000)}k` : Math.round(line.value)}
            </text>
          </g>
        ))}

        {avgY !== null ? (
          <line className="chart__goal" x1={PAD_L} x2={W - PAD_R} y1={avgY} y2={avgY} />
        ) : null}

        {bars.map((bar) => (
          <g
            key={bar.key}
            className="chart__col"
            onMouseEnter={() => setHover(bar.i)}
            onMouseLeave={() => setHover(null)}
          >
            <rect
              className={`chart__bar${bar.emphasis ? ' chart__bar--active' : ''}`}
              x={bar.x - bar.w / 2}
              y={bar.y}
              width={bar.w}
              height={bar.h}
              rx={Math.min(3, bar.w / 2)}
              style={reduced ? { animation: 'none' } : { animationDelay: `${Math.min(bar.i * 14, 380)}ms` }}
            />
            <rect
              className="chart__hit"
              x={bar.x - (W - PAD_L - PAD_R) / data.length / 2}
              y={PAD_T}
              width={(W - PAD_L - PAD_R) / data.length}
              height={H - PAD_T - PAD_B}
            />
          </g>
        ))}

        {bars.map((bar) =>
          bar.i % labelEvery === 0 ? (
            <text key={`l-${bar.key}`} className="chart__axis" x={bar.x} y={H - 9} textAnchor="middle">
              {bar.label}
            </text>
          ) : null,
        )}
      </svg>

      {active ? (
        <span
          className="chart__tip"
          style={{
            left: `${(active.x / W) * 100}%`,
            top: `${(active.y / H) * 100}%`,
            marginTop: -10,
          }}
        >
          {formatInt(active.value)} {unit}
          <small>{active.caption ?? active.label}</small>
        </span>
      ) : null}

      {/* The same data, readable by a screen reader and by anyone who prefers a table. */}
      <table className="sr-only">
        <caption>Activity by period</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">{unit}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.key}>
              <th scope="row">{point.caption ?? point.label}</th>
              <td>{formatInt(point.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="chart" aria-hidden="true">
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 200, paddingLeft: 44 }}>
        {[52, 78, 40, 92, 64, 100, 48, 84, 58, 72, 44, 88].map((h, i) => (
          <span
            key={i}
            className="skeleton"
            style={{ display: 'block', flex: 1, height: `${h}%`, borderRadius: 4 }}
          />
        ))}
      </div>
    </div>
  );
}
