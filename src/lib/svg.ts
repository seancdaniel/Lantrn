export interface Point {
  x: number;
  y: number;
}

/**
 * Catmull-Rom through the given points, converted to cubic beziers.
 * The route is authored as a list of stops; the curve between them is derived,
 * so moving an encounter in the admin never leaves a kinked path behind.
 */
export function smoothPath(points: Point[], tension = 0.5) {
  if (points.length < 2) return '';
  const p = [points[0], ...points, points[points.length - 1]];
  let d = `M${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let i = 1; i < p.length - 2; i += 1) {
    const p0 = p[i - 1];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2];

    const c1x = p1.x + ((p2.x - p0.x) / 6) * tension * 2;
    const c1y = p1.y + ((p2.y - p0.y) / 6) * tension * 2;
    const c2x = p2.x - ((p3.x - p1.x) / 6) * tension * 2;
    const c2y = p2.y - ((p3.y - p1.y) / 6) * tension * 2;

    d += ` C${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return d;
}

/** Route stops, authored by hand so the map reads as a drawn illustration. */
export const ROUTE_STOPS: Point[] = [
  { x: 92, y: 604 },
  { x: 152, y: 532 },
  { x: 216, y: 478 },
  { x: 286, y: 430 },
  { x: 350, y: 368 },
  { x: 400, y: 300 },
  { x: 452, y: 252 },
  { x: 508, y: 226 },
  { x: 572, y: 268 },
  { x: 628, y: 340 },
  { x: 668, y: 420 },
  { x: 702, y: 500 },
  { x: 760, y: 542 },
  { x: 824, y: 498 },
  { x: 872, y: 420 },
  { x: 908, y: 336 },
  { x: 958, y: 288 },
  { x: 1020, y: 308 },
  { x: 1072, y: 378 },
  { x: 1118, y: 470 },
];

export const MAP_VIEWBOX = { w: 1200, h: 700 };

