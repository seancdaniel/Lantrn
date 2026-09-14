import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Announcement, Character, Destination, Milestone, User } from '@/types';
import { communityMembers, feed } from '@/data/community';
import { TODAY } from '@/data/activity';
import type { EncounterInput, LogInput, PersistenceAdapter, Snapshot } from '@/lib/db/types';
import { useToast } from '@/state/toast';
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
import { Brandmark } from '@/components/ui/Brand';
import { ErrorState } from '@/components/ui/Primitives';

interface StoreValue extends Snapshot {
  today: string;
  /** True when writes reach a server rather than this browser alone. */
  isRemote: boolean;
  logActivity: (input: LogInput) => void;
  deleteActivity: (id: string) => void;
  updateUser: (patch: Partial<User>) => void;
  saveEncounter: (encounter: EncounterInput) => void;
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

function reorder<T extends { id: string; order: number }>(items: T[], id: string, direction: -1 | 1) {
  const ordered = sortByOrder(items);
  const index = ordered.findIndex((i) => i.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= ordered.length) return null;
  const swapped = [...ordered];
  [swapped[index], swapped[target]] = [swapped[target], swapped[index]];
  return swapped.map((item, i) => ({ ...item, order: i }));
}

export function BootScreen() {
  return (
    <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: 'var(--canvas)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--s-4)' }}>
        <Brandmark size={44} />
        <p className="eyebrow">Loading your journey</p>
      </div>
    </div>
  );
}

export function StoreProvider({
  adapter,
  children,
}: {
  adapter: PersistenceAdapter;
  children: ReactNode;
}) {
  const [state, setState] = useState<Snapshot | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const { push } = useToast();
  const stale = useRef(false);

  useEffect(() => {
    stale.current = false;
    setState(null);
    setFailure(null);
    adapter
      .load()
      .then((snapshot) => {
        if (!stale.current) setState(snapshot);
      })
      .catch((error: unknown) => {
        if (!stale.current) setFailure(error instanceof Error ? error.message : String(error));
      });
    return () => {
      stale.current = true;
    };
  }, [adapter, attempt]);

  /**
   * Applies the change locally first so the interface stays immediate, then
   * writes it through. A failed write reloads from the source rather than
   * leaving the screen showing something the database does not agree with.
   */
  const mutate = useCallback(
    (apply: (snapshot: Snapshot) => Snapshot, write: () => Promise<void>) => {
      setState((prev) => (prev ? apply(prev) : prev));
      void write().catch(async (error: unknown) => {
        push({
          title: 'That did not save',
          body: error instanceof Error ? error.message : 'Something went wrong.',
          icon: 'alert',
        });
        try {
          const fresh = await adapter.load();
          if (!stale.current) setState(fresh);
        } catch {
          /* the reload failed too; the error toast already told the story */
        }
      });
    },
    [adapter, push],
  );

  const value = useMemo<StoreValue | null>(() => {
    if (!state) return null;

    return {
      ...state,
      today: TODAY,
      isRemote: adapter.isRemote,

      logActivity: (input) =>
        mutate((s) => {
          const existing = s.activities.find((a) => a.date === input.date);
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
          const next = {
            id: existing?.id ?? `a_${input.date}`,
            userId: s.user.id,
            date: input.date,
            steps,
            miles: steps / s.user.stepsPerMile,
            activeMinutes,
            calories: null,
            source: 'manual',
          };
          return {
            ...s,
            activities: existing
              ? s.activities.map((a) => (a.date === input.date ? next : a))
              : [...s.activities, next].sort((a, b) => a.date.localeCompare(b.date)),
          };
        }, () => adapter.logActivity(input)),

      deleteActivity: (id) =>
        mutate(
          (s) => ({ ...s, activities: s.activities.filter((a) => a.id !== id) }),
          () => adapter.deleteActivity(id),
        ),

      updateUser: (patch) =>
        mutate((s) => {
          const user = { ...s.user, ...patch };
          // Stride is retroactive: distance is a view of steps, never stored alone.
          const activities =
            patch.stepsPerMile && patch.stepsPerMile !== s.user.stepsPerMile
              ? s.activities.map((a) => ({ ...a, miles: a.steps / patch.stepsPerMile! }))
              : s.activities;
          return { ...s, user, activities };
        }, () => adapter.updateUser(patch)),

      saveEncounter: (encounter) =>
        mutate((s) => {
          const id = encounter.id ?? `e_${encounter.characterId}`;
          const record = { ...encounter, id, userId: s.user.id };
          return {
            ...s,
            encounters: s.encounters.some((e) => e.id === id)
              ? s.encounters.map((e) => (e.id === id ? record : e))
              : [...s.encounters, record],
          };
        }, () => adapter.saveEncounter(encounter)),

      deleteEncounter: (id) =>
        mutate(
          (s) => ({ ...s, encounters: s.encounters.filter((e) => e.id !== id) }),
          () => adapter.deleteEncounter(id),
        ),

      saveCharacter: (character) =>
        mutate(
          (s) => ({
            ...s,
            characters: s.characters.some((c) => c.id === character.id)
              ? s.characters.map((c) => (c.id === character.id ? character : c))
              : [...s.characters, character],
          }),
          () => adapter.saveCharacter(character),
        ),

      deleteCharacter: (id) =>
        mutate(
          (s) => ({
            ...s,
            characters: sortByOrder(s.characters.filter((c) => c.id !== id)).map((c, i) => ({
              ...c,
              order: i,
            })),
            encounters: s.encounters.filter((e) => e.characterId !== id),
          }),
          () => adapter.deleteCharacter(id),
        ),

      moveCharacter: (id, direction) => {
        const next = reorder(state.characters, id, direction);
        if (!next) return;
        mutate(
          (s) => ({ ...s, characters: next }),
          () => adapter.reorderCharacters(next),
        );
      },

      saveDestination: (destination) =>
        mutate(
          (s) => ({
            ...s,
            destinations: s.destinations.some((d) => d.id === destination.id)
              ? s.destinations.map((d) => (d.id === destination.id ? destination : d))
              : [...s.destinations, destination],
          }),
          () => adapter.saveDestination(destination),
        ),

      moveDestination: (id, direction) => {
        const next = reorder(state.destinations, id, direction);
        if (!next) return;
        mutate(
          (s) => ({ ...s, destinations: next }),
          () => adapter.reorderDestinations(next),
        );
      },

      saveMilestone: (milestone) =>
        mutate(
          (s) => ({
            ...s,
            milestones: s.milestones.some((m) => m.id === milestone.id)
              ? s.milestones.map((m) => (m.id === milestone.id ? milestone : m))
              : [...s.milestones, milestone],
          }),
          () => adapter.saveMilestone(milestone),
        ),

      deleteMilestone: (id) =>
        mutate(
          (s) => ({ ...s, milestones: s.milestones.filter((m) => m.id !== id) }),
          () => adapter.deleteMilestone(id),
        ),

      saveAnnouncement: (announcement) =>
        mutate(
          (s) => ({
            ...s,
            announcements: s.announcements.some((a) => a.id === announcement.id)
              ? s.announcements.map((a) => (a.id === announcement.id ? announcement : a))
              : [announcement, ...s.announcements],
          }),
          () => adapter.saveAnnouncement(announcement),
        ),

      deleteAnnouncement: (id) =>
        mutate(
          (s) => ({ ...s, announcements: s.announcements.filter((a) => a.id !== id) }),
          () => adapter.deleteAnnouncement(id),
        ),

      resetDemo: () => {
        void adapter
          .reset()
          .then(() => setAttempt((a) => a + 1))
          .catch((error: unknown) => {
            push({
              title: 'Could not reset',
              body: error instanceof Error ? error.message : 'Something went wrong.',
              icon: 'alert',
            });
          });
      },
    };
  }, [state, adapter, mutate]);

  if (failure) {
    return (
      <div className="page">
        <ErrorState detail={failure} onRetry={() => setAttempt((a) => a + 1)} />
      </div>
    );
  }

  if (!value) return <BootScreen />;

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

/** Everything the interface reads is derived here, so no page recomputes progress. */
export function useJourney() {
  const { activities, characters, destinations, milestones, encounters, user, today } = useStore();

  return useMemo(() => {
    const totals = computeTotals(activities);
    const progress = computeCharacterProgress(characters, encounters, activities, user.stepsPerMile);
    const destinationProgress = computeDestinationProgress(destinations, progress);
    const total = routeLength(characters);
    const milestoneStates = computeMilestones(milestones, activities);

    return {
      totals,
      progress,
      destinationProgress,
      leg: currentLeg(progress),
      routeMiles: total,
      routePercentage: total === 0 ? 0 : Math.min(1, totals.miles / total),
      records: computeRecords(activities),
      level: computeLevel(totals.miles),
      milestoneStates,
      nextMilestone: milestoneStates.find((m) => !m.unlocked) ?? null,
      unlockedCount: progress.filter((p) => p.status !== 'locked' && p.status !== 'in-progress').length,
      completedDestinations: destinationProgress.filter((d) => d.status === 'completed').length,
      todayActivity: activities.find((a) => a.date === today) ?? null,
      encounters,
    };
  }, [activities, characters, destinations, milestones, encounters, user.stepsPerMile, today]);
}

export { communityMembers, feed };
