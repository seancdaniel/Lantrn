import type {
  Activity,
  Character,
  CharacterProgress,
  Destination,
  DestinationProgress,
  Encounter,
  Level,
  Milestone,
  Records,
  Totals,
} from '@/types';
import { clamp, milesToSteps } from '@/lib/format';

export const LEVEL_FLOORS = [
  0, 5, 15, 30, 55, 90, 140, 205, 290, 395, 520, 670, 850, 1150, 1400, 1700, 2050, 2450, 2900, 3400,
];

export const LEVEL_TITLES = [
  'First Steps', 'Pathfinder', 'Wanderer', 'Trailgoer', 'Roamer',
  'Lantern Bearer', 'Waymarker', 'Trailblazer', 'Far Walker', 'Realm Traveler',
  'Longstrider', 'Journeyer', 'Pathmaster', 'Realm Explorer', 'Wayfinder',
  'Horizon Chaser', 'Milewright', 'Grand Voyager', 'Legend of the Road', 'Living Landmark',
];

export const sortByOrder = <T extends { order: number }>(items: T[]) =>
  [...items].sort((a, b) => a.order - b.order);

export function computeTotals(activities: Activity[]): Totals {
  return activities.reduce<Totals>(
    (acc, a) => ({
      miles: acc.miles + a.miles,
      steps: acc.steps + a.steps,
      activeMinutes: acc.activeMinutes + a.activeMinutes,
      walkingDays: acc.walkingDays + (a.steps > 0 ? 1 : 0),
    }),
    { miles: 0, steps: 0, activeMinutes: 0, walkingDays: 0 },
  );
}

/** Running lifetime distance, oldest day first. Used to date every unlock retroactively. */
export function buildCumulative(activities: Activity[]) {
  const sorted = [...activities].sort((a, b) => a.date.localeCompare(b.date));
  let running = 0;
  return sorted.map((a) => {
    running += a.miles;
    return { date: a.date, miles: running };
  });
}

export function dateReached(cumulative: { date: string; miles: number }[], miles: number) {
  const hit = cumulative.find((c) => c.miles >= miles);
  return hit ? hit.date : null;
}

/** Lifetime distance at which each character's leg begins and ends. */
export function legThresholds(characters: Character[]) {
  const ordered = sortByOrder(characters);
  let running = 0;
  return ordered.map((character, index) => {
    const startMiles = running;
    running += character.requiredMiles;
    return { character, index, startMiles, endMiles: running };
  });
}

export const routeLength = (characters: Character[]) =>
  characters.reduce((sum, c) => sum + c.requiredMiles, 0);

export function computeCharacterProgress(
  characters: Character[],
  encounters: Encounter[],
  activities: Activity[],
  stepsPerMile: number,
): CharacterProgress[] {
  const totalMiles = computeTotals(activities).miles;
  const cumulative = buildCumulative(activities);
  const byCharacter = new Map(encounters.map((e) => [e.characterId, e]));

  return legThresholds(characters).map(({ character, index, startMiles, endMiles }) => {
    const currentMiles = clamp(totalMiles - startMiles, 0, character.requiredMiles);
    const percentage = character.requiredMiles === 0 ? 1 : currentMiles / character.requiredMiles;
    const encounter = byCharacter.get(character.id) ?? null;

    let status: CharacterProgress['status'];
    if (totalMiles >= endMiles) status = encounter ? 'completed' : 'ready';
    else if (totalMiles > startMiles) status = 'in-progress';
    else status = 'locked';

    return {
      character,
      index,
      startMiles,
      endMiles,
      currentMiles,
      requiredSteps: milesToSteps(character.requiredMiles, stepsPerMile),
      currentSteps: milesToSteps(currentMiles, stepsPerMile),
      percentage,
      status,
      unlockedAt: totalMiles >= endMiles ? dateReached(cumulative, endMiles) : null,
      completedAt: encounter ? encounter.date : null,
      encounter,
      milesRemaining: Math.max(0, character.requiredMiles - currentMiles),
    };
  });
}

export function computeDestinationProgress(
  destinations: Destination[],
  progress: CharacterProgress[],
): DestinationProgress[] {
  return sortByOrder(destinations).map((destination, index) => {
    const legs = progress.filter((p) => p.character.destinationId === destination.id);
    const startMiles = legs.length ? legs[0].startMiles : 0;
    const endMiles = legs.length ? legs[legs.length - 1].endMiles : 0;
    const span = endMiles - startMiles;
    const walked = legs.reduce((sum, leg) => sum + leg.currentMiles, 0);
    const unlockedCount = legs.filter((l) => l.status === 'completed' || l.status === 'ready').length;

    let status: DestinationProgress['status'] = 'locked';
    if (unlockedCount === legs.length && legs.length > 0) status = 'completed';
    else if (walked > 0) status = 'in-progress';

    return {
      destination,
      index,
      characters: legs,
      startMiles,
      endMiles,
      percentage: span === 0 ? 0 : walked / span,
      status,
      unlockedCount,
    };
  });
}

export function currentLeg(progress: CharacterProgress[]) {
  return (
    progress.find((p) => p.status === 'in-progress') ??
    progress.find((p) => p.status === 'ready') ??
    progress.find((p) => p.status === 'locked') ??
    progress[progress.length - 1] ??
    null
  );
}

export function computeStreaks(activities: Activity[]) {
  const sorted = [...activities].sort((a, b) => a.date.localeCompare(b.date));
  let longest = 0;
  let run = 0;
  for (const a of sorted) {
    run = a.steps > 0 ? run + 1 : 0;
    if (run > longest) longest = run;
  }

  let current = 0;
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    if (sorted[i].steps > 0) current += 1;
    else break;
  }
  return { currentStreak: current, longestStreak: longest };
}

export function computeRecords(activities: Activity[]): Records {
  const walked = activities.filter((a) => a.steps > 0);
  const best = (pick: (a: Activity) => number) =>
    walked.reduce<Activity | null>((top, a) => (!top || pick(a) > pick(top) ? a : top), null);

  return {
    mostStepsInADay: best((a) => a.steps),
    mostMilesInADay: best((a) => a.miles),
    longestWalk: best((a) => a.activeMinutes),
    ...computeStreaks(activities),
  };
}

export function computeLevel(miles: number): Level {
  let level = 1;
  for (let i = 0; i < LEVEL_FLOORS.length; i += 1) {
    if (miles >= LEVEL_FLOORS[i]) level = i + 1;
  }
  const floor = LEVEL_FLOORS[level - 1];
  const ceiling = LEVEL_FLOORS[level] ?? floor + 600;
  return {
    level,
    title: LEVEL_TITLES[level - 1] ?? LEVEL_TITLES[LEVEL_TITLES.length - 1],
    floor,
    ceiling,
    percentage: clamp((miles - floor) / (ceiling - floor), 0, 1),
    milesToNext: Math.max(0, ceiling - miles),
  };
}

export interface MilestoneState {
  milestone: Milestone;
  unlocked: boolean;
  unlockedAt: string | null;
  percentage: number;
  milesRemaining: number;
}

export function computeMilestones(
  milestones: Milestone[],
  activities: Activity[],
): MilestoneState[] {
  const totalMiles = computeTotals(activities).miles;
  const cumulative = buildCumulative(activities);
  return [...milestones]
    .sort((a, b) => a.requiredMiles - b.requiredMiles)
    .map((milestone) => ({
      milestone,
      unlocked: totalMiles >= milestone.requiredMiles,
      unlockedAt: totalMiles >= milestone.requiredMiles ? dateReached(cumulative, milestone.requiredMiles) : null,
      percentage: clamp(totalMiles / milestone.requiredMiles, 0, 1),
      milesRemaining: Math.max(0, milestone.requiredMiles - totalMiles),
    }));
}

/** Dashboard voice. The headline changes with how the journey is actually going. */
export function journeyMood(leg: CharacterProgress | null, todaySteps: number) {
  if (!leg) return { headline: 'The route is complete.', sub: 'Every encounter on the map is behind you.' };
  if (leg.status === 'ready') return { headline: 'You made it.', sub: 'An encounter is waiting to be logged.' };
  if (leg.milesRemaining <= 3) return { headline: 'Almost there.', sub: 'Close enough to finish it tonight.' };
  if (leg.percentage >= 0.6) return { headline: 'Serious progress.', sub: 'The hard part of this leg is behind you.' };
  if (todaySteps < 2000) return { headline: 'Your next adventure is waiting.', sub: 'It starts the moment you stand up.' };
  return { headline: 'Keep walking.', sub: 'The next encounter is closer than it was this morning.' };
}
