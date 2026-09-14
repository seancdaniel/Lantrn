import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Activity,
  Announcement,
  Character,
  Destination,
  Encounter,
  Milestone,
  User,
} from '@/types';
import { ENCOUNTER_PHOTO_BUCKET } from '@/lib/supabase/client';
import { AdapterError, type EncounterInput, type LogInput, type PersistenceAdapter, type Snapshot } from './types';

/* Row shapes, mirroring supabase/migrations/0001_schema.sql --------------- */

interface ProfileRow {
  id: string;
  name: string;
  handle: string;
  avatar_url: string | null;
  steps_per_mile: number;
  role: 'member' | 'admin';
  leaderboard_visible: boolean;
  created_at: string;
}

interface ActivityRow {
  id: string;
  user_id: string;
  date: string;
  steps: number;
  active_minutes: number;
  calories: number | null;
  source: string;
}

interface CharacterRow {
  id: string;
  name: string;
  epithet: string;
  description: string;
  required_miles: number;
  destination_id: string;
  order_index: number;
  note: string | null;
}

interface DestinationRow {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  order_index: number;
  palette: Destination['palette'];
}

interface MilestoneRow {
  id: string;
  name: string;
  required_miles: number;
  description: string;
}

interface EncounterRow {
  id: string;
  user_id: string;
  character_id: string;
  date: string;
  location: string;
  photo_path: string | null;
  notes: string;
  rating: number | null;
}

interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  published_at: string;
  active: boolean;
}

/* Mapping ----------------------------------------------------------------- */

const toUser = (r: ProfileRow): User => ({
  id: r.id,
  name: r.name,
  handle: r.handle,
  email: '',
  avatar: r.avatar_url,
  createdAt: r.created_at,
  role: r.role,
  stepsPerMile: Number(r.steps_per_mile),
});

/** Distance is derived here exactly as it is everywhere else: steps ÷ stride. */
const toActivity = (r: ActivityRow, stepsPerMile: number): Activity => ({
  id: r.id,
  userId: r.user_id,
  date: r.date,
  steps: r.steps,
  miles: r.steps / stepsPerMile,
  activeMinutes: r.active_minutes,
  calories: r.calories,
  source: r.source,
});

const toCharacter = (r: CharacterRow): Character => ({
  id: r.id,
  name: r.name,
  epithet: r.epithet,
  description: r.description,
  requiredMiles: Number(r.required_miles),
  destinationId: r.destination_id,
  order: r.order_index,
  ...(r.note ? { note: r.note } : {}),
});

const toDestination = (r: DestinationRow): Destination => ({
  id: r.id,
  name: r.name,
  subtitle: r.subtitle,
  description: r.description,
  order: r.order_index,
  palette: r.palette,
});

const toMilestone = (r: MilestoneRow): Milestone => ({
  id: r.id,
  name: r.name,
  requiredMiles: Number(r.required_miles),
  description: r.description,
});

const toEncounter = (r: EncounterRow, photoUrl: string | null): Encounter => ({
  id: r.id,
  userId: r.user_id,
  characterId: r.character_id,
  date: r.date,
  location: r.location,
  photo: photoUrl,
  notes: r.notes,
  rating: r.rating,
});

const toAnnouncement = (r: AnnouncementRow): Announcement => ({
  id: r.id,
  title: r.title,
  body: r.body,
  publishedAt: r.published_at,
  active: r.active,
});

/* Adapter ------------------------------------------------------------------ */

export class SupabaseAdapter implements PersistenceAdapter {
  readonly id = 'supabase' as const;
  readonly isRemote = true;

  constructor(
    private readonly db: SupabaseClient,
    private readonly userId: string,
  ) {}

  private fail(what: string, error: unknown): never {
    throw new AdapterError(`Could not ${what}.`, error);
  }

  async load(): Promise<Snapshot> {
    const [profile, characters, destinations, milestones, encounters, announcements] =
      await Promise.all([
        this.db.from('profiles').select('*').eq('id', this.userId).single(),
        this.db.from('characters').select('*').order('order_index'),
        this.db.from('destinations').select('*').order('order_index'),
        this.db.from('milestones').select('*').order('required_miles'),
        this.db.from('encounters').select('*').eq('user_id', this.userId),
        this.db.from('announcements').select('*').order('published_at', { ascending: false }),
      ]);

    if (profile.error) this.fail('load your profile', profile.error);
    if (characters.error) this.fail('load the route', characters.error);

    const user = toUser(profile.data as ProfileRow);

    // Activities are fetched after the profile because distance depends on stride.
    const activities = await this.db
      .from('activities')
      .select('*')
      .eq('user_id', this.userId)
      .order('date');
    if (activities.error) this.fail('load your walking history', activities.error);

    const encounterRows = (encounters.data ?? []) as EncounterRow[];
    const photoUrls = await this.resolvePhotos(encounterRows);

    return {
      user,
      activities: ((activities.data ?? []) as ActivityRow[]).map((r) =>
        toActivity(r, user.stepsPerMile),
      ),
      characters: ((characters.data ?? []) as CharacterRow[]).map(toCharacter),
      destinations: ((destinations.data ?? []) as DestinationRow[]).map(toDestination),
      milestones: ((milestones.data ?? []) as MilestoneRow[]).map(toMilestone),
      encounters: encounterRows.map((r) => toEncounter(r, photoUrls.get(r.id) ?? null)),
      announcements: ((announcements.data ?? []) as AnnouncementRow[]).map(toAnnouncement),
    };
  }

  /** The bucket is private, so photos are read through short-lived signed URLs. */
  private async resolvePhotos(rows: EncounterRow[]): Promise<Map<string, string>> {
    const withPhotos = rows.filter((r) => r.photo_path);
    const urls = new Map<string, string>();
    if (withPhotos.length === 0) return urls;

    const { data } = await this.db.storage
      .from(ENCOUNTER_PHOTO_BUCKET)
      .createSignedUrls(withPhotos.map((r) => r.photo_path as string), 3600);

    data?.forEach((entry, i) => {
      if (entry.signedUrl) urls.set(withPhotos[i].id, entry.signedUrl);
    });
    return urls;
  }

  async logActivity(input: LogInput) {
    const { data: existing } = await this.db
      .from('activities')
      .select('steps, active_minutes')
      .eq('user_id', this.userId)
      .eq('date', input.date)
      .maybeSingle();

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
              ? (existing?.active_minutes ?? 0) + input.activeMinutes
              : input.activeMinutes,
          );

    const { error } = await this.db.from('activities').upsert(
      {
        user_id: this.userId,
        date: input.date,
        steps,
        active_minutes: activeMinutes,
        calories: null,
        source: 'manual',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,date' },
    );
    if (error) this.fail('save that walk', error);
  }

  async deleteActivity(id: string) {
    const { error } = await this.db.from('activities').delete().eq('id', id);
    if (error) this.fail('delete that day', error);
  }

  async updateUser(patch: Partial<User>) {
    const row: Record<string, unknown> = {};
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.handle !== undefined) row.handle = patch.handle;
    if (patch.avatar !== undefined) row.avatar_url = patch.avatar;
    if (patch.stepsPerMile !== undefined) row.steps_per_mile = patch.stepsPerMile;
    if (Object.keys(row).length === 0) return;

    const { error } = await this.db.from('profiles').update(row).eq('id', this.userId);
    if (error) this.fail('update your profile', error);
  }

  async saveEncounter(encounter: EncounterInput) {
    const photoPath = await this.storePhoto(encounter.characterId, encounter.photo);

    const { error } = await this.db.from('encounters').upsert(
      {
        user_id: this.userId,
        character_id: encounter.characterId,
        date: encounter.date,
        location: encounter.location,
        notes: encounter.notes,
        rating: encounter.rating,
        ...(photoPath !== undefined ? { photo_path: photoPath } : {}),
      },
      { onConflict: 'user_id,character_id' },
    );
    if (error) this.fail('save that encounter', error);
  }

  /**
   * Returns the object key to persist, `null` to clear, or `undefined` to leave
   * the stored photo untouched. Data URLs are uploaded; signed URLs are values
   * we handed out on load and must not be written back.
   */
  private async storePhoto(characterId: string, photo: string | null): Promise<string | null | undefined> {
    if (photo === null) return null;
    if (!photo.startsWith('data:')) return undefined;

    const [meta, base64] = photo.split(',');
    const contentType = meta.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg';
    const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const path = `${this.userId}/${characterId}-${Date.now()}.${ext}`;

    const { error } = await this.db.storage
      .from(ENCOUNTER_PHOTO_BUCKET)
      .upload(path, bytes, { contentType, upsert: true });
    if (error) this.fail('upload that photo', error);
    return path;
  }

  async deleteEncounter(id: string) {
    const { error } = await this.db.from('encounters').delete().eq('id', id);
    if (error) this.fail('remove that encounter', error);
  }

  async saveCharacter(character: Character) {
    const { error } = await this.db.from('characters').upsert({
      id: character.id,
      name: character.name,
      epithet: character.epithet,
      description: character.description,
      required_miles: character.requiredMiles,
      destination_id: character.destinationId,
      order_index: character.order,
      note: character.note ?? null,
    });
    if (error) this.fail('save that character', error);
  }

  async deleteCharacter(id: string) {
    const { error } = await this.db.from('characters').delete().eq('id', id);
    if (error) this.fail('delete that character', error);
  }

  async reorderCharacters(ordered: Character[]) {
    const { error } = await this.db.from('characters').upsert(
      ordered.map((c) => ({
        id: c.id,
        name: c.name,
        epithet: c.epithet,
        description: c.description,
        required_miles: c.requiredMiles,
        destination_id: c.destinationId,
        order_index: c.order,
        note: c.note ?? null,
      })),
    );
    if (error) this.fail('reorder the route', error);
  }

  async saveDestination(destination: Destination) {
    const { error } = await this.db.from('destinations').upsert({
      id: destination.id,
      name: destination.name,
      subtitle: destination.subtitle,
      description: destination.description,
      order_index: destination.order,
      palette: destination.palette,
    });
    if (error) this.fail('save that destination', error);
  }

  async reorderDestinations(ordered: Destination[]) {
    const { error } = await this.db.from('destinations').upsert(
      ordered.map((d) => ({
        id: d.id,
        name: d.name,
        subtitle: d.subtitle,
        description: d.description,
        order_index: d.order,
        palette: d.palette,
      })),
    );
    if (error) this.fail('reorder destinations', error);
  }

  async saveMilestone(milestone: Milestone) {
    const { error } = await this.db.from('milestones').upsert({
      id: milestone.id,
      name: milestone.name,
      required_miles: milestone.requiredMiles,
      description: milestone.description,
    });
    if (error) this.fail('save that milestone', error);
  }

  async deleteMilestone(id: string) {
    const { error } = await this.db.from('milestones').delete().eq('id', id);
    if (error) this.fail('delete that milestone', error);
  }

  async saveAnnouncement(announcement: Announcement) {
    const isNew = announcement.id.startsWith('an_');
    const row = {
      title: announcement.title,
      body: announcement.body,
      published_at: announcement.publishedAt,
      active: announcement.active,
    };
    const { error } = isNew
      ? await this.db.from('announcements').insert(row)
      : await this.db.from('announcements').update(row).eq('id', announcement.id);
    if (error) this.fail('save that announcement', error);
  }

  async deleteAnnouncement(id: string) {
    const { error } = await this.db.from('announcements').delete().eq('id', id);
    if (error) this.fail('delete that announcement', error);
  }

  async reset() {
    throw new AdapterError('Resetting demo data is only available on a local account.');
  }
}
