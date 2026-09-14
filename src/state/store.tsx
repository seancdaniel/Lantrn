import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  Activity,
  Announcement,
  Character,
  Destination,
  Encounter,
  Milestone,
  User,
} from '@/types';
import { characters as seedCharacters } from '@/data/characters';
import { destinations as seedDestinations } from '@/data/destinations';
import { milestones as seedMilestones } from '@/data/milestones';
import { announcements as seedAnnouncements, communityMembers, demoUser, feed } from '@/data/community';
import { DEFAULT_STEPS_PER_MILE, TODAY, buildActivityHistory } from '@/data/activity';
import { buildSeedEncounters } from '@/data/encounters';
import {
  computeCharacterProgress,
  computeDestinationProgress,
  computeLevel,
  computeMilestones,
  computeRecords,
  computeTotals,
  currentLeg,
  routeLength,
  sortByOrder,
} from '@/lib/progress';

const STORAGE_KEY = 'milepost.state.v1';

interface Persisted {
  user: User;
  activities: Activity[];
  characters: Character[];
  destinations: Destination[];
  milestones: Milestone[];
  encounters: Encounter[];
  announcements: Announcement[];
}

function buildSeed(): Persisted {
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

function load(): Persisted {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildSeed();
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    const seed = buildSeed();
    // Merge against the seed so a schema addition never leaves a stored account broken.
    return { ...seed, ...parsed };
  } catch {
    return buildSeed();
  }
}

export interface LogInput {
  date: string;
  steps: number;
  activeMinutes: number | null;
  mode: 'add' | 'set';
}

interface StoreValue extends Persisted {
  today: string;
  logActivity: (input: LogInput) => void;
  deleteActivity: (id: string) => void;
  updateUser: (patch: Partial<User>) => void;
  saveEncounter: (encounter: Omit<Encounter, 'id' | 'userId'> & { id?: string }) => void;
  deleteEncounter: (id: string) => void;
  saveCharacter: (character: Character) => void;
  deleteCharacter: (id: string) => void;
  moveCharacter: (id: string, direction: -1 | 1) => void;
  saveDestination: (destination: Destination) => void;
  moveDestination: (id: string, direction: -1 | 1) => void;
  saveMilestone: (milestone: Milestone) => void;
  deleteMilestone: (id: string) => void;
  saveAnnouncement: (announcement: Announcement) => void;
  deleteAnnouncement: (id: string) => void;
  resetDemo: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(load);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable — the session still works, it just will not persist */
    }
  }, [state]);

  const logActivity = useCallback((input: LogInput) => {
    setState((prev) => {
      const existing = prev.activities.find((a) => a.date === input.date);
      const steps = input.mode === 'add' ? (existing?.steps ?? 0) + input.steps : input.steps;
      const activeMinutes =
        input.activeMinutes === null
          ? Math.round(steps / 93)
          : input.mode === 'add'
            ? (existing?.activeMinutes ?? 0) + input.activeMinutes
            : input.activeMinutes;

      const next: Activity = {
        id: existing?.id ?? `a_${input.date}`,
        userId: prev.user.id,
        date: input.date,
        steps: Math.max(0, steps),
        miles: Math.max(0, steps) / prev.user.stepsPerMile,
        activeMinutes: Math.max(0, activeMinutes),
        calories: null,
        source: 'manual',
      };

      const activities = existing
        ? prev.activities.map((a) => (a.date === input.date ? next : a))
        : [...prev.activities, next].sort((a, b) => a.date.localeCompare(b.date));

      return { ...prev, activities };
    });
  }, []);

  const deleteActivity = useCallback((id: string) => {
    setState((prev) => ({ ...prev, activities: prev.activities.filter((a) => a.id !== id) }));
  }, []);

  const updateUser = useCallback((patch: Partial<User>) => {
    setState((prev) => {
      const user = { ...prev.user, ...patch };
      // Stride is retroactive: distance is a view of steps, never stored on its own.
      const activities =
        patch.stepsPerMile && patch.stepsPerMile !== prev.user.stepsPerMile
          ? prev.activities.map((a) => ({ ...a, miles: a.steps / patch.stepsPerMile! }))
          : prev.activities;
      return { ...prev, user, activities };
    });
  }, []);

  const saveEncounter = useCallback<StoreValue['saveEncounter']>((encounter) => {
    setState((prev) => {
      const id = encounter.id ?? `e_${encounter.characterId}`;
      const record: Encounter = { ...encounter, id, userId: prev.user.id };
      const exists = prev.encounters.some((e) => e.id === id);
      return {
        ...prev,
        encounters: exists
          ? prev.encounters.map((e) => (e.id === id ? record : e))
          : [...prev.encounters, record],
      };
    });
  }, []);

  const deleteEncounter = useCallback((id: string) => {
    setState((prev) => ({ ...prev, encounters: prev.encounters.filter((e) => e.id !== id) }));
  }, []);

  const saveCharacter = useCallback((character: Character) => {
    setState((prev) => ({
      ...prev,
      characters: prev.characters.some((c) => c.id === character.id)
        ? prev.characters.map((c) => (c.id === character.id ? character : c))
        : [...prev.characters, character],
    }));
  }, []);

  const deleteCharacter = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      characters: sortByOrder(prev.characters.filter((c) => c.id !== id)).map((c, i) => ({ ...c, order: i })),
      encounters: prev.encounters.filter((e) => e.characterId !== id),
    }));
  }, []);

  const reorder = <T extends { id: string; order: number }>(items: T[], id: string, direction: -1 | 1) => {
    const ordered = sortByOrder(items);
    const index = ordered.findIndex((i) => i.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return items;
    const swapped = [...ordered];
    [swapped[index], swapped[target]] = [swapped[target], swapped[index]];
    return swapped.map((item, i) => ({ ...item, order: i }));
  };

  const moveCharacter = useCallback((id: string, direction: -1 | 1) => {
    setState((prev) => ({ ...prev, characters: reorder(prev.characters, id, direction) }));
  }, []);

  const saveDestination = useCallback((destination: Destination) => {
    setState((prev) => ({
      ...prev,
      destinations: prev.destinations.some((d) => d.id === destination.id)
        ? prev.destinations.map((d) => (d.id === destination.id ? destination : d))
        : [...prev.destinations, destination],
    }));
  }, []);

  const moveDestination = useCallback((id: string, direction: -1 | 1) => {
    setState((prev) => ({ ...prev, destinations: reorder(prev.destinations, id, direction) }));
  }, []);

  const saveMilestone = useCallback((milestone: Milestone) => {
    setState((prev) => ({
      ...prev,
      milestones: prev.milestones.some((m) => m.id === milestone.id)
        ? prev.milestones.map((m) => (m.id === milestone.id ? milestone : m))
        : [...prev.milestones, milestone],
    }));
  }, []);

  const deleteMilestone = useCallback((id: string) => {
    setState((prev) => ({ ...prev, milestones: prev.milestones.filter((m) => m.id !== id) }));
  }, []);

  const saveAnnouncement = useCallback((announcement: Announcement) => {
    setState((prev) => ({
      ...prev,
      announcements: prev.announcements.some((a) => a.id === announcement.id)
        ? prev.announcements.map((a) => (a.id === announcement.id ? announcement : a))
        : [announcement, ...prev.announcements],
    }));
  }, []);

  const deleteAnnouncement = useCallback((id: string) => {
    setState((prev) => ({ ...prev, announcements: prev.announcements.filter((a) => a.id !== id) }));
  }, []);

  const resetDemo = useCallback(() => {
    setState(buildSeed());
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      today: TODAY,
      logActivity,
      deleteActivity,
      updateUser,
      saveEncounter,
      deleteEncounter,
      saveCharacter,
      deleteCharacter,
      moveCharacter,
      saveDestination,
      moveDestination,
      saveMilestone,
      deleteMilestone,
      saveAnnouncement,
      deleteAnnouncement,
      resetDemo,
    }),
    [
      state, logActivity, deleteActivity, updateUser, saveEncounter, deleteEncounter,
      saveCharacter, deleteCharacter, moveCharacter, saveDestination, moveDestination,
      saveMilestone, deleteMilestone, saveAnnouncement, deleteAnnouncement, resetDemo,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

/** Everything the interface reads is derived here, so no page recomputes progress itself. */
export function useJourney() {
  const { activities, characters, destinations, milestones, encounters, user, today } = useStore();

  return useMemo(() => {
    const totals = computeTotals(activities);
    const progress = computeCharacterProgress(characters, encounters, activities, user.stepsPerMile);
    const destinationProgress = computeDestinationProgress(destinations, progress);
    const leg = currentLeg(progress);
    const total = routeLength(characters);
    const todayActivity = activities.find((a) => a.date === today) ?? null;
    const milestoneStates = computeMilestones(milestones, activities);

    return {
      totals,
      progress,
      destinationProgress,
      leg,
      routeMiles: total,
      routePercentage: total === 0 ? 0 : Math.min(1, totals.miles / total),
      records: computeRecords(activities),
      level: computeLevel(totals.miles),
      milestoneStates,
      nextMilestone: milestoneStates.find((m) => !m.unlocked) ?? null,
      unlockedCount: progress.filter((p) => p.status !== 'locked' && p.status !== 'in-progress').length,
      completedDestinations: destinationProgress.filter((d) => d.status === 'completed').length,
      todayActivity,
      encounters,
    };
  }, [activities, characters, destinations, milestones, encounters, user.stepsPerMile, today]);
}

export { communityMembers, feed };
