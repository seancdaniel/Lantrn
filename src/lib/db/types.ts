import type {
  Activity,
  Announcement,
  Character,
  Destination,
  Encounter,
  Milestone,
  User,
} from '@/types';

/** Everything the interface needs in one read. */
export interface Snapshot {
  user: User;
  activities: Activity[];
  characters: Character[];
  destinations: Destination[];
  milestones: Milestone[];
  encounters: Encounter[];
  announcements: Announcement[];
}

export interface LogInput {
  date: string;
  steps: number;
  activeMinutes: number | null;
  mode: 'add' | 'set';
}

export type EncounterInput = Omit<Encounter, 'id' | 'userId'> & { id?: string };

/**
 * One row of the community ranking.
 *
 * Steps rather than miles, because every walker has their own stride — a row is
 * converted using *that person's* steps_per_mile, never the viewer's.
 */
export interface LeaderboardEntry {
  handle: string;
  stepsPerMile: number;
  lifetimeSteps: number;
  weeklySteps: number;
  monthlySteps: number;
  walkingDays: number;
  encountersLogged: number;
}

/**
 * The seam between the product and wherever its data happens to live.
 *
 * Both implementations satisfy this: one writes to local storage, the other to
 * Postgres. Nothing above this layer — no page, no component, no selector —
 * knows or cares which is in use.
 */
export interface PersistenceAdapter {
  readonly id: 'local' | 'supabase';
  /** True when writes reach a server rather than this browser. */
  readonly isRemote: boolean;

  load(): Promise<Snapshot>;

  /** Other people's totals. Only those who opted in are returned. */
  fetchLeaderboard(): Promise<LeaderboardEntry[]>;

  logActivity(input: LogInput): Promise<void>;
  deleteActivity(id: string): Promise<void>;

  updateUser(patch: Partial<User>): Promise<void>;

  saveEncounter(encounter: EncounterInput): Promise<void>;
  deleteEncounter(id: string): Promise<void>;

  saveCharacter(character: Character): Promise<void>;
  deleteCharacter(id: string): Promise<void>;
  reorderCharacters(ordered: Character[]): Promise<void>;

  saveDestination(destination: Destination): Promise<void>;
  reorderDestinations(ordered: Destination[]): Promise<void>;

  saveMilestone(milestone: Milestone): Promise<void>;
  deleteMilestone(id: string): Promise<void>;

  saveAnnouncement(announcement: Announcement): Promise<void>;
  deleteAnnouncement(id: string): Promise<void>;

  /** Restores the seeded demo account. Local only; remote adapters may refuse. */
  reset(): Promise<void>;
}

export class AdapterError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AdapterError';
  }
}
