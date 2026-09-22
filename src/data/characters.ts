import type { Character } from '@/types';

/**
 * The cast, in route order.
 *
 * Each figure is drawn from the stock of a widely known journey — a messenger who
 * brings an impossible invitation, a scarecrow with no brains and good instincts, a
 * creature that follows you in the dark. Archetypes and situations, never names,
 * places or lines from any particular work.
 *
 * `requiredMiles` is the length of this leg — the distance from the previous
 * encounter to this one. Lifetime thresholds are derived, never stored.
 */
export const characters: Character[] = [
  /* 01 — The Hidden School ------------------------------------------------- */
  {
    id: 'letterbearer',
    name: 'The Letterbearer',
    epithet: 'Brings an invitation that should not exist',
    description:
      'Turns up with a letter addressed to you in a hand nobody recognises, at an address you never gave anyone. Will not answer questions and will not leave until you read it.',
    requiredMiles: 5,
    destinationId: 'hidden-school',
    order: 0,
  },
  {
    id: 'platform-warden',
    name: 'The Platform Warden',
    epithet: 'Keeps the gap in the wall',
    description:
      'Stands on a station concourse all day watching people walk past a doorway none of them can see. Nods once at the ones who can, and never twice.',
    requiredMiles: 10,
    destinationId: 'hidden-school',
    order: 1,
  },
  {
    id: 'lakekeeper',
    name: 'The Lakekeeper',
    epithet: 'Rows the new ones across',
    description:
      'Enormous, gentle, and unreasonably fond of things with teeth. Takes the first-years over the black water at dusk because the view from the boat is the whole point.',
    requiredMiles: 15,
    destinationId: 'hidden-school',
    order: 2,
  },
  {
    id: 'headmaster',
    name: 'The Headmaster',
    epithet: 'Already knew you were coming',
    description:
      'Waits at the top of the steps with his hands behind his back, entirely unsurprised. Answers the question you meant to ask rather than the one you did.',
    requiredMiles: 20,
    destinationId: 'hidden-school',
    order: 3,
  },

  /* 02 — The Emerald Road --------------------------------------------------- */
  {
    id: 'strawman',
    name: 'The Strawman',
    epithet: 'Convinced he has no brains',
    description:
      'Spends the whole road apologising for being stupid while quietly solving every problem the party runs into. Nobody has the heart to point it out.',
    requiredMiles: 25,
    destinationId: 'emerald-road',
    order: 4,
  },
  {
    id: 'rusted-woodsman',
    name: 'The Rusted Woodsman',
    epithet: 'Seized solid in the rain',
    description:
      'Found mid-swing, frozen where he stood, waiting for somebody with an oil can. Weeps easily, which is the exact opposite of his stated problem.',
    requiredMiles: 30,
    destinationId: 'emerald-road',
    order: 5,
  },
  {
    id: 'timid-king',
    name: 'The Timid King',
    epithet: 'Loudest when most afraid',
    description:
      'King of every beast on the road and terrified of all of them. The roar is real. So is the shaking underneath it.',
    requiredMiles: 45,
    destinationId: 'emerald-road',
    order: 6,
  },
  {
    id: 'man-behind-the-curtain',
    name: 'The Man Behind the Curtain',
    epithet: 'Smaller than advertised',
    description:
      'Enormous voice, enormous smoke, enormous everything — until somebody pulls the drape back and finds an ordinary man working levers. Gives good advice anyway.',
    requiredMiles: 50,
    destinationId: 'emerald-road',
    order: 7,
  },

  /* 03 — The Forgotten North ----------------------------------------------- */
  {
    id: 'voice-past-the-mountains',
    name: 'The Voice Past the Mountains',
    epithet: 'Four notes, and only you can hear them',
    description:
      'Starts as something you can almost ignore and becomes the only thing you can hear. Nobody else in the room reacts, which is how you know it is meant for you.',
    requiredMiles: 60,
    destinationId: 'forgotten-north',
    order: 8,
  },
  {
    id: 'ember-lizard',
    name: 'The Ember Lizard',
    epithet: 'Smallest thing here, and the most flammable',
    description:
      'Sets a whole autumn wood alight because it panicked, then sits on your outstretched hand and calms down. Both facts are equally true.',
    requiredMiles: 70,
    destinationId: 'forgotten-north',
    order: 9,
  },
  {
    id: 'horse-of-the-deep',
    name: 'The Horse of the Deep',
    epithet: 'The crossing has to be ridden',
    description:
      'Guards the water the way weather guards a mountain, without malice and without mercy. Will drown you twice before it agrees to carry you.',
    requiredMiles: 80,
    destinationId: 'forgotten-north',
    order: 10,
  },
  {
    id: 'river-that-remembers',
    name: 'The River That Remembers',
    epithet: 'Frozen, and it kept everything',
    description:
      'A glacier that runs like water if you know how to listen. Every account of what really happened is in here, including the ones nobody wanted kept.',
    requiredMiles: 90,
    destinationId: 'forgotten-north',
    order: 11,
  },

  /* 04 — The Thorn Castle --------------------------------------------------- */
  {
    id: 'bookseller',
    name: 'The Bookseller',
    epithet: 'The only one who understood',
    description:
      'Keeps the small shop at the end of the square and lets you take the same volume home for the third time without a word about it.',
    requiredMiles: 100,
    destinationId: 'thorn-castle',
    order: 12,
  },
  {
    id: 'hollow-wolves',
    name: 'The Hollow Wolves',
    epithet: 'The stretch between the mill and the gates',
    description:
      'Not one encounter but six, in a wood where the safe road ends. You do not meet them so much as get through them.',
    requiredMiles: 110,
    destinationId: 'thorn-castle',
    order: 13,
  },
  {
    id: 'rose-gardener',
    name: 'The Rose Gardener',
    epithet: 'Tends what the curse left behind',
    description:
      'Still pruning a garden nobody visits, under glass, for a household that stopped counting years a while ago. Insists it will matter again.',
    requiredMiles: 120,
    destinationId: 'thorn-castle',
    order: 14,
  },
  {
    id: 'lord-of-thorns',
    name: 'The Lord of Thorns',
    epithet: 'Handling it badly',
    description:
      'Enormous, furious, and profoundly embarrassed about all of it. Offers you the library by way of apology, which very nearly works.',
    requiredMiles: 130,
    destinationId: 'thorn-castle',
    order: 15,
  },

  /* 05 — The Mountain Road -------------------------------------------------- */
  {
    id: 'old-wanderer',
    name: 'The Old Wanderer',
    epithet: 'Grey cloak, worse news',
    description:
      'Arrives unannounced, stays exactly as long as it takes to ruin your plans, and leaves you holding something you did not ask for.',
    requiredMiles: 105,
    destinationId: 'mountain-road',
    order: 16,
  },
  {
    id: 'sworn-companion',
    name: 'The Sworn Companion',
    epithet: 'Will not be left behind',
    description:
      'Follows you into water he cannot swim, because the alternative was letting you go alone. Carries the pans, the rope, and eventually you.',
    requiredMiles: 135,
    destinationId: 'mountain-road',
    order: 17,
  },
  {
    id: 'creature-in-the-dark',
    name: 'The Creature in the Dark',
    epithet: 'Has been following you for weeks',
    description:
      'Wants the thing you are carrying more than it has ever wanted anything, and knows the only road left. Both of those facts are useful to you.',
    requiredMiles: 65,
    destinationId: 'mountain-road',
    order: 18,
    note: 'A hidden encounter — deliberately shorter than the legs on either side of it.',
  },
  {
    id: 'forgemaster',
    name: 'The Forgemaster',
    epithet: 'Made the thing you are carrying',
    description:
      'Waits at the top of the ash, at the fire where it was poured. The whole route exists to bring you back to this door and leave with nothing.',
    requiredMiles: 185,
    destinationId: 'mountain-road',
    order: 19,
    note: 'The end of the quest itself. One encounter waits beyond it.',
  },
  {
    id: 'hymnkeeper',
    name: 'The Hymnkeeper',
    epithet: 'Walks ahead, carrying the only light',
    description:
      'Comes up the road at dusk swinging a lantern and singing something you half recognise. By the time he has gone past, a fair number of the people behind you are walking with him instead. Puts the light out when he is finished talking, and lets the dark do the rest of the work.',
    requiredMiles: 100,
    destinationId: 'mountain-road',
    order: 20,
    note: 'A coda. The quest ends at the fire; this is who is waiting on the road afterwards.',
  },
];
