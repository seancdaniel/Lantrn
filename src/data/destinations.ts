import type { Destination } from '@/types';

/**
 * Five destinations, each the shape of a journey everybody already knows: the
 * hidden school, the road to the green city, the spirit town, the cursed castle,
 * the long walk to the mountain.
 *
 * These lean on the trope, never the property — no protected name, place or
 * character appears anywhere. Recognition is the point; reproduction is not.
 */
export const destinations: Destination[] = [
  {
    id: 'hidden-school',
    name: 'The Hidden School',
    subtitle: 'A gap in the wall, and a castle across the water',
    description:
      'It starts with a letter nobody can explain and ends at a gate that opens on its own. The shortest destination on the route, because the only job of this stretch is to get you out the door.',
    order: 0,
    palette: { deep: '#1B2033', mid: '#464F78', glow: '#D4B36A' },
  },
  {
    id: 'emerald-road',
    name: 'The Emerald Road',
    subtitle: 'One long road, one green city',
    description:
      'A single paved road through a country that makes no sense, walked in the company of three travellers who each believe they are missing something.',
    order: 1,
    palette: { deep: '#14301F', mid: '#2F6B45', glow: '#7ECB8F' },
  },
  {
    id: 'forgotten-north',
    name: 'The Forgotten North',
    subtitle: 'A voice past the mountains, and the river at the end of it',
    description:
      'North until the maps give up: a wood that has been sealed behind fog for a generation, a sea nobody crosses on foot, and a frozen river that kept every single thing that ever happened.',
    order: 2,
    palette: { deep: '#0D2733', mid: '#2A6B84', glow: '#9BDDEE' },
  },
  {
    id: 'thorn-castle',
    name: 'The Thorn Castle',
    subtitle: 'A village, a wood, and a bargain',
    description:
      'Out of a town that never understood you, through a wood that would rather you turned back, to a door that has been waiting a very long time.',
    order: 3,
    palette: { deep: '#2B1520', mid: '#6E3348', glow: '#D48A9E' },
  },
  {
    id: 'mountain-road',
    name: 'The Mountain Road',
    subtitle: 'Carrying something back to the place that made it',
    description:
      'The longest destination on the route, and the only one where the goal is to arrive empty-handed. Ash underfoot for the last two hundred miles.',
    order: 4,
    palette: { deep: '#241A16', mid: '#6B3A2A', glow: '#D9764A' },
  },
];
