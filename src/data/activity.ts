import type { Activity } from '@/types';
import { mulberry32 } from '@/lib/rng';
import { addDays } from '@/lib/format';

/**
 * Seed activity history.
 *
 * Everything here is derived from three anchors so the demo account is internally
 * consistent wherever a number is shown: a lifetime step count, a stride, and a
 * fixed final week. Miles are never stored independently of steps.
 */
export const TODAY = '2026-09-09';
export const DEMO_USER_ID = 'u_1';

/** ~2.64 ft stride. The common 2,000-steps-per-mile rule, kept exact for the demo totals. */
export const DEFAULT_STEPS_PER_MILE = 2000.5;

const HISTORY_DAYS = 260;
const LIFETIME_STEPS = 2_493_842;

/** Days with no recorded walking. Placed to give a 47-day best streak and a 23-day current one. */
const REST_DAYS = new Set([4, 11, 18, 26, 35, 47, 58, 70, 83, 96, 110, 124, 137, 150, 198, 209, 221, 236]);

/** The most recent seven days are fixed so the week view always reads the same. */
const FIXED_TAIL = [8_420, 13_440, 18_230, 11_870, 9_870, 15_210, 12_483];

/** Days given a deliberate long-walk weighting, which is where the personal records come from. */
const STANDOUT_DAYS: Record<number, number> = { 88: 1.82, 172: 2.24, 205: 1.71, 243: 1.66 };

export const START_DATE = addDays(TODAY, -(HISTORY_DAYS - 1));

function rawWeight(index: number, rnd: () => number) {
  const date = addDays(START_DATE, index);
  const weekday = new Date(`${date}T00:00:00`).getDay();
  const isWeekend = weekday === 0 || weekday === 6;

  // A slow upward drift over the year: the habit builds.
  const drift = 0.78 + (index / HISTORY_DAYS) * 0.44;
  const shape = isWeekend ? 1.24 : 0.94;
  const noise = 0.62 + rnd() * 0.78;
  const standout = STANDOUT_DAYS[index] ?? 1;
  return drift * shape * noise * standout;
}

export function buildActivityHistory(
  userId = DEMO_USER_ID,
  stepsPerMile = DEFAULT_STEPS_PER_MILE,
): Activity[] {
  const rnd = mulberry32(0x5150);
  const tailStart = HISTORY_DAYS - FIXED_TAIL.length;
  const tailTotal = FIXED_TAIL.reduce((a, b) => a + b, 0);

  const weights: number[] = [];
  let weightSum = 0;
  for (let i = 0; i < tailStart; i += 1) {
    const w = REST_DAYS.has(i) ? 0 : rawWeight(i, rnd);
    weights.push(w);
    weightSum += w;
  }

  const scale = (LIFETIME_STEPS - tailTotal) / weightSum;
  const steps = weights.map((w) => (w === 0 ? 0 : Math.round(w * scale)));

  // Rounding leaves a handful of steps unaccounted for. Settle them on one ordinary day
  // rather than smearing an artefact across the whole history.
  const residual = LIFETIME_STEPS - tailTotal - steps.reduce((a, b) => a + b, 0);
  steps[131] += residual;

  const all = [...steps, ...FIXED_TAIL];
  const paceRnd = mulberry32(0x2f18);

  return all.map((daySteps, i) => {
    const date = addDays(START_DATE, i);
    const isToday = i === HISTORY_DAYS - 1;
    // Pace drifts day to day, so the longest walk by time is not always the biggest by steps.
    const pace = isToday ? 93 : 86 + paceRnd() * 14;
    return {
      id: `a_${date}`,
      userId,
      date,
      steps: daySteps,
      miles: daySteps / stepsPerMile,
      activeMinutes: daySteps === 0 ? 0 : Math.round(daySteps / pace),
      calories: null,
      source: 'manual',
    } satisfies Activity;
  });
}

/** Deterministic hourly split for the day view. Real providers would supply this directly. */
export function hourlyBreakdown(totalSteps: number, seed = 0x77aa) {
  const shape = [
    0.2, 0.1, 0.05, 0.05, 0.1, 0.4, 1.1, 2.6, 3.4, 2.8, 3.1, 3.6,
    4.2, 3.4, 3.0, 3.3, 4.1, 5.2, 6.4, 5.1, 3.2, 1.9, 0.9, 0.4,
  ];
  const rnd = mulberry32(seed);
  const nowHour = 20;
  const jittered = shape.map((s, hour) => (hour > nowHour ? 0 : s * (0.82 + rnd() * 0.36)));
  const sum = jittered.reduce((a, b) => a + b, 0);

  const buckets = jittered.map((w, hour) => ({ hour, steps: Math.round((w / sum) * totalSteps) }));
  const drift = totalSteps - buckets.reduce((a, b) => a + b.steps, 0);
  buckets[nowHour].steps += drift;
  return buckets;
}
