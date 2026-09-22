import type { Activity, Announcement, Character, Destination, Encounter, Milestone, User } from '@/types';
import { characters as seedCharacters } from '@/data/characters';
import { destinations as seedDestinations } from '@/data/destinations';
import { milestones as seedMilestones } from '@/data/milestones';
import { announcements as seedAnnouncements, communityMembers, demoUser } from '@/data/community';
import { DEFAULT_STEPS_PER_MILE, buildActivityHistory } from '@/data/activity';
import { buildSeedEncounters } from '@/data/encounters';
import { sortByOrder } from '@/lib/progress';
import type {
  EncounterInput,
  LeaderboardEntry,
  LogInput,
  PersistenceAdapter,
  Snapshot,
} from './types';

const STORAGE_KEY = 'lantrn.state.v1';

function buildSeed(): Snapshot {
  const activities = buildActivityHistory(demoUser.id, DEFAULT_STEPS_PER_MILE);
  return {
    user: demoUser,
    activities,
    characters: seedCharacters,
    destinations: seedDestinations,
    milestones: seedMilestones,
    encounters: buildSeedEncounters(activities, seedCharacters),
    announcements: seedAnnouncements,
  };
}

/**
 * The original behaviour, kept whole: a seeded demo account in this browser.
 * It is the fallback when Supabase is not configured, and the reason the app
 * still demonstrates itself on a fresh deploy with no backend attached.
 */
export class LocalAdapter implements PersistenceAdapter {
  readonly id = 'local' as const;
  readonly isRemote = false;

  private state: Snapshot = buildSeed();

  async load(): Promise<Snapshot> {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const seed = buildSeed();
      // Merged against the seed so a schema addition never strands a stored account.
      this.state = raw ? { ...seed, ...(JSON.parse(raw) as Partial<Snapshot>) } : seed;
    } catch {
      this.state = buildSeed();
    }
    return this.state;
  }

  /** The seeded community, shaped exactly like the database view returns it. */
  async fetchLeaderboard(): Promise<LeaderboardEntry[]> {
    const stride = this.state.user.stepsPerMile;
    return communityMembers.map((m) => ({
      handle: m.handle,
      stepsPerMile: stride,
      lifetimeSteps: Math.round(m.lifetimeMiles * stride),
      weeklySteps: m.weeklySteps,
      monthlySteps: Math.round(m.monthlyMiles * stride),
      walkingDays: 0,
      encountersLogged: m.charactersUnlocked,
    }));
  }

  private commit(next: Partial<Snapshot>) {
    this.state = { ...this.state, ...next };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      /* private mode or quota — the session still works, it just will not persist */
    }
  }

  async logActivity(input: LogInput) {
    const existing = this.state.activities.find((a) => a.date === input.date);
    const steps = Math.max(
      0,
      input.mode === 'add' ? (existing?.steps ?? 0) + input.steps : input.steps,
    );
    const activeMinutes =
      input.activeMinutes === null
        ? Math.round(steps / 93)
        : Math.max(
            0,
            input.mode === 'add'
              ? (existing?.activeMinutes ?? 0) + input.activeMinutes
              : input.activeMinutes,
          );

    const next: Activity = {
      id: existing?.id ?? `a_${input.date}`,
      userId: this.state.user.id,
      date: input.date,
      steps,
      miles: steps / this.state.user.stepsPerMile,
      activeMinutes,
      calories: null,
      source: 'manual',
    };

    this.commit({
      activities: existing
        ? this.state.activities.map((a) => (a.date === input.date ? next : a))
        : [...this.state.activities, next].sort((a, b) => a.date.localeCompare(b.date)),
    });
  }

  async deleteActivity(id: string) {
    this.commit({ activities: this.state.activities.filter((a) => a.id !== id) });
  }

  async updateUser(patch: Partial<User>) {
    const user = { ...this.state.user, ...patch };
    // Stride is retroactive: distance is a view of steps, never stored alone.
    const activities =
      patch.stepsPerMile && patch.stepsPerMile !== this.state.user.stepsPerMile
        ? this.state.activities.map((a) => ({ ...a, miles: a.steps / patch.stepsPerMile! }))
        : this.state.activities;
    this.commit({ user, activities });
  }

  async saveEncounter(encounter: EncounterInput) {
    const id = encounter.id ?? `e_${encounter.characterId}`;
    const record: Encounter = { ...encounter, id, userId: this.state.user.id };
    const exists = this.state.encounters.some((e) => e.id === id);
    this.commit({
      encounters: exists
        ? this.state.encounters.map((e) => (e.id === id ? record : e))
        : [...this.state.encounters, record],
    });
  }

  async deleteEncounter(id: string) {
    this.commit({ encounters: this.state.encounters.filter((e) => e.id !== id) });
  }

  async saveCharacter(character: Character) {
    this.commit({
      characters: this.state.characters.some((c) => c.id === character.id)
        ? this.state.characters.map((c) => (c.id === character.id ? character : c))
        : [...this.state.characters, character],
    });
  }

  async deleteCharacter(id: string) {
    this.commit({
      characters: sortByOrder(this.state.characters.filter((c) => c.id !== id)).map((c, i) => ({
        ...c,
        order: i,
      })),
      encounters: this.state.encounters.filter((e) => e.characterId !== id),
    });
  }

  async reorderCharacters(ordered: Character[]) {
    this.commit({ characters: ordered });
  }

  async saveDestination(destination: Destination) {
    this.commit({
      destinations: this.state.destinations.some((d) => d.id === destination.id)
        ? this.state.destinations.map((d) => (d.id === destination.id ? destination : d))
        : [...this.state.destinations, destination],
    });
  }

  async reorderDestinations(ordered: Destination[]) {
    this.commit({ destinations: ordered });
  }

  async saveMilestone(milestone: Milestone) {
    this.commit({
      milestones: this.state.milestones.some((m) => m.id === milestone.id)
        ? this.state.milestones.map((m) => (m.id === milestone.id ? milestone : m))
        : [...this.state.milestones, milestone],
    });
  }

  async deleteMilestone(id: string) {
    this.commit({ milestones: this.state.milestones.filter((m) => m.id !== id) });
  }

  async saveAnnouncement(announcement: Announcement) {
    this.commit({
      announcements: this.state.announcements.some((a) => a.id === announcement.id)
        ? this.state.announcements.map((a) => (a.id === announcement.id ? announcement : a))
        : [announcement, ...this.state.announcements],
    });
  }

  async deleteAnnouncement(id: string) {
    this.commit({ announcements: this.state.announcements.filter((a) => a.id !== id) });
  }

  async reset() {
    this.state = buildSeed();
    this.commit({});
  }
}
