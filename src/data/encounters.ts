import type { Activity, Character, Encounter } from '@/types';
import { buildCumulative, dateReached, legThresholds, sortByOrder } from '@/lib/progress';
import { addDays } from '@/lib/format';
import { mulberry32 } from '@/lib/rng';
import { DEMO_USER_ID, TODAY } from '@/data/activity';

const LOCATIONS = [
  'Riverside Loop',
  'Harbour Path',
  'Old Mill Trail',
  'The Esplanade',
  'Cedar Ridge',
  'Fountain Square',
  'The Long Way Home',
  'Wharf Road',
  'Hillside Park',
  'Canal Towpath',
];

const NOTES: Record<string, string> = {
  letterbearer: 'Five miles in and already talking to imaginary people. Worth it.',
  'platform-warden': 'Walked this one at dusk on purpose. Recommended.',
  lakekeeper: 'Finished this leg along the reservoir, which felt appropriate.',
  headmaster: 'First destination done. Did not think I would get here.',
  strawman: 'Hit this one on the morning loop before work. Quiet, cold, good.',
  'timid-king': 'Forty-five miles of talking myself into it.',
  'man-behind-the-curtain': 'Two hundred miles. The number stopped feeling abstract.',
  'voice-past-the-mountains': 'Sixty miles is a lot when nothing changes on the horizon.',
  'horse-of-the-deep': 'Rough month. Took three weeks longer than it should have.',
  'river-that-remembers': 'Halfway marker on the same walk. Good day.',
  bookseller: 'Finished at 11pm under an actually clear sky. Perfect timing.',
  'rose-gardener': 'Rain the entire way and I did not mind at all.',
  'lord-of-thorns': 'Four destinations down. Only the last stretch left.',
  'old-wanderer': 'Longest leg so far and it did not feel like it.',
};

/**
 * Builds the demo account's encounter log from the activity history, so every
 * unlock date is one the walking record actually supports.
 */
export function buildSeedEncounters(activities: Activity[], characters: Character[]): Encounter[] {
  const cumulative = buildCumulative(activities);
  const rnd = mulberry32(0x1cf3);
  const ordered = sortByOrder(characters);
  // Everything up to and including the old wanderer has been met in person.
  const loggedThrough = ordered.findIndex((c) => c.id === 'old-wanderer');

  return legThresholds(characters)
    .filter(({ index }) => index <= loggedThrough)
    .map(({ character, index, endMiles }) => {
      const unlocked = dateReached(cumulative, endMiles) ?? TODAY;
      const lag = Math.floor(rnd() * 3);
      const date = addDays(unlocked, lag) > TODAY ? unlocked : addDays(unlocked, lag);
      const rating = index % 4 === 1 ? 4 : index % 7 === 0 ? 5 : index % 3 === 0 ? 5 : 4;

      return {
        id: `e_${character.id}`,
        userId: DEMO_USER_ID,
        characterId: character.id,
        date,
        location: LOCATIONS[index % LOCATIONS.length],
        photo: null,
        notes: NOTES[character.id] ?? '',
        rating,
      } satisfies Encounter;
    });
}
