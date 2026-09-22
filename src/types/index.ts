export type CharacterStatus = 'locked' | 'in-progress' | 'ready' | 'completed';
export type Role = 'member' | 'admin';

export interface User {
  id: string;
  name: string;
  handle: string;
  email: string;
  avatar: string | null;
  createdAt: string;
  role: Role;
  /** Steps per mile, derived from stride length. Editable in Settings. */
  stepsPerMile: number;
  /** Opt in to appearing on the community leaderboard. */
  leaderboardVisible: boolean;
}

export interface Activity {
  id: string;
  userId: string;
  /** ISO date, YYYY-MM-DD */
  date: string;
  steps: number;
  miles: number;
  activeMinutes: number;
  /** Null when the source cannot supply it, e.g. manual entry. Never estimated. */
  calories: number | null;
  source: string;
}

export interface Destination {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  order: number;
  palette: { deep: string; mid: string; glow: string };
}

export interface Character {
  id: string;
  name: string;
  epithet: string;
  description: string;
  /** Length of this leg of the journey, not a lifetime total. */
  requiredMiles: number;
  destinationId: string;
  order: number;
  note?: string;
}

export interface Encounter {
  id: string;
  userId: string;
  characterId: string;
  date: string;
  location: string;
  photo: string | null;
  notes: string;
  rating: number | null;
}

export interface Milestone {
  id: string;
  name: string;
  requiredMiles: number;
  description: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  active: boolean;
}

export interface CommunityMember {
  id: string;
  handle: string;
  initials: string;
  accent: string;
  weeklyMiles: number;
  monthlyMiles: number;
  lifetimeMiles: number;
  weeklySteps: number;
  charactersUnlocked: number;
  isFriend: boolean;
  isSelf?: boolean;
}

export interface FeedItem {
  id: string;
  handle: string;
  initials: string;
  accent: string;
  kind: 'encounter' | 'distance' | 'milestone' | 'streak';
  text: string;
  at: string;
}

/** A character with the signed-in user's progress folded in. */
export interface CharacterProgress {
  character: Character;
  index: number;
  startMiles: number;
  endMiles: number;
  currentMiles: number;
  requiredSteps: number;
  currentSteps: number;
  percentage: number;
  status: CharacterStatus;
  unlockedAt: string | null;
  completedAt: string | null;
  encounter: Encounter | null;
  milesRemaining: number;
}

export interface DestinationProgress {
  destination: Destination;
  index: number;
  characters: CharacterProgress[];
  startMiles: number;
  endMiles: number;
  percentage: number;
  status: 'locked' | 'in-progress' | 'completed';
  unlockedCount: number;
}

export interface Totals {
  miles: number;
  steps: number;
  activeMinutes: number;
  walkingDays: number;
}

export interface Records {
  mostStepsInADay: Activity | null;
  mostMilesInADay: Activity | null;
  longestWalk: Activity | null;
  currentStreak: number;
  longestStreak: number;
}

export interface Level {
  level: number;
  title: string;
  floor: number;
  ceiling: number;
  percentage: number;
  milesToNext: number;
}
