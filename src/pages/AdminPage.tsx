import { useMemo, useState } from 'react';
import { communityMembers, useJourney, useStore } from '@/state/store';
import { useToast } from '@/state/toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Avatar, Card, Field, Input, Pill, Select, Switch, Textarea } from '@/components/ui/Primitives';
import { Modal } from '@/components/ui/Modal';
import { Icon } from '@/components/ui/Icon';
import { CharacterImage } from '@/components/media';
import { sortByOrder } from '@/lib/progress';
import { formatDateLong, formatInt, formatMiles } from '@/lib/format';
import type { Announcement, Character, Destination, Milestone } from '@/types';

type Tab = 'characters' | 'destinations' | 'milestones' | 'users' | 'activity' | 'encounters' | 'announcements';

const TABS: { value: Tab; label: string }[] = [
  { value: 'characters', label: 'Characters' },
  { value: 'destinations', label: 'Destinations' },
  { value: 'milestones', label: 'Milestones' },
  { value: 'encounters', label: 'Encounters' },
  { value: 'activity', label: 'Activity' },
  { value: 'users', label: 'Users' },
  { value: 'announcements', label: 'Announcements' },
];

function OrderControls({
  onUp,
  onDown,
  first,
  last,
  label,
}: {
  onUp: () => void;
  onDown: () => void;
  first: boolean;
  last: boolean;
  label: string;
}) {
  return (
    <span className="orderctl">
      <button type="button" onClick={onUp} disabled={first} aria-label={`Move ${label} earlier`}>
        <Icon name="chevronUp" size={12} />
      </button>
      <button type="button" onClick={onDown} disabled={last} aria-label={`Move ${label} later`}>
        <Icon name="chevronDown" size={12} />
      </button>
    </span>
  );
}

export function AdminPage() {
  const store = useStore();
  const { progress, routeMiles, totals } = useJourney();
  const { push } = useToast();
  const [tab, setTab] = useState<Tab>('characters');

  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  const characters = useMemo(() => sortByOrder(store.characters), [store.characters]);
  const destinations = useMemo(() => sortByOrder(store.destinations), [store.destinations]);
  const milestones = useMemo(
    () => [...store.milestones].sort((a, b) => a.requiredMiles - b.requiredMiles),
    [store.milestones],
  );
  const recentActivity = useMemo(
    () => [...store.activities].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 24),
    [store.activities],
  );

  if (store.user.role !== 'admin') {
    return (
      <div className="page">
        <div className="state" role="alert">
          <span className="state__art">
            <Icon name="lock" size={30} />
          </span>
          <h1 className="state__title">Staff only.</h1>
          <p className="state__body">This area is limited to accounts with the admin role.</p>
        </div>
      </div>
    );
  }

  const blankCharacter = (): Character => ({
    id: `c_${Date.now()}`,
    name: 'New Character',
    epithet: '',
    description: '',
    requiredMiles: 25,
    destinationId: destinations[0]?.id ?? '',
    order: characters.length,
  });

  return (
    <div className="page page--wide">
      <PageHeader
        eyebrow="Administration"
        title="Content"
        description="Route content, ordering, and the records behind every account."
        actions={
          <div className="row" style={{ gap: 'var(--s-2)' }}>
            <Pill plain>{characters.length} encounters</Pill>
            <Pill plain>{formatMiles(routeMiles)} mi route</Pill>
          </div>
        }
      />

      <div className="admin-tabs" role="tablist" aria-label="Admin sections">
        {TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            className="admin-tab"
            aria-selected={tab === item.value}
            onClick={() => setTab(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 'var(--s-6)' }}>
        {/* Characters ---------------------------------------------------- */}
        {tab === 'characters' ? (
          <Card flush>
            <div className="row row--between" style={{ padding: 'var(--s-4) var(--s-5)' }}>
              <p className="card__label">Order determines the route. Distance is per leg, not cumulative.</p>
              <Button size="sm" variant="accent" icon="plus" onClick={() => setEditingCharacter(blankCharacter())}>
                New character
              </Button>
            </div>
            <div className="tablewrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 56 }}>Order</th>
                    <th style={{ width: 52 }}>Art</th>
                    <th>Name</th>
                    <th>Destination</th>
                    <th className="num">Miles</th>
                    <th className="num">Steps</th>
                    <th className="num">Unlocks at</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {characters.map((character, index) => {
                    const entry = progress.find((p) => p.character.id === character.id);
                    return (
                      <tr key={character.id}>
                        <td>
                          <div className="row" style={{ gap: 8 }}>
                            <OrderControls
                              label={character.name}
                              first={index === 0}
                              last={index === characters.length - 1}
                              onUp={() => store.moveCharacter(character.id, -1)}
                              onDown={() => store.moveCharacter(character.id, 1)}
                            />
                            <span className="muted numeric">{index + 1}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ width: 36 }}>
                            <CharacterImage
                              character={character}
                              destination={destinations.find((d) => d.id === character.destinationId)}
                              status="completed"
                              ratio="square"
                            />
                          </div>
                        </td>
                        <td>
                          <p style={{ fontWeight: 600 }}>{character.name}</p>
                          <p className="muted" style={{ fontSize: 'var(--text-xs)' }}>
                            {character.epithet || <em>No epithet</em>}
                          </p>
                        </td>
                        <td className="muted">
                          {destinations.find((d) => d.id === character.destinationId)?.name ?? '—'}
                        </td>
                        <td className="num">{formatMiles(character.requiredMiles)}</td>
                        <td className="num">{formatInt(character.requiredMiles * store.user.stepsPerMile)}</td>
                        <td className="num">{entry ? `${formatMiles(entry.endMiles)} mi` : '—'}</td>
                        <td>
                          <div className="row" style={{ gap: 4, justifyContent: 'flex-end' }}>
                            <Button size="sm" variant="ghost" icon="pencil" onClick={() => setEditingCharacter(character)} aria-label={`Edit ${character.name}`} />
                            <Button
                              size="sm"
                              variant="ghost"
                              icon="trash"
                              aria-label={`Delete ${character.name}`}
                              onClick={() => {
                                store.deleteCharacter(character.id);
                                push({ title: `${character.name} removed`, icon: 'alert' });
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ) : null}

        {/* Destinations -------------------------------------------------- */}
        {tab === 'destinations' ? (
          <div className="stack">
            {destinations.map((destination, index) => (
              <Card key={destination.id}>
                <div className="row row--between row--wrap" style={{ gap: 'var(--s-4)' }}>
                  <div className="row" style={{ gap: 'var(--s-4)', minWidth: 0 }}>
                    <OrderControls
                      label={destination.name}
                      first={index === 0}
                      last={index === destinations.length - 1}
                      onUp={() => store.moveDestination(destination.id, -1)}
                      onDown={() => store.moveDestination(destination.id, 1)}
                    />
                    <span className="destcard__index">{String(index + 1).padStart(2, '0')}</span>
                    <div style={{ minWidth: 0 }}>
                      <p className="destcard__name">{destination.name}</p>
                      <p className="muted" style={{ fontSize: 'var(--text-xs)' }}>
                        {destination.subtitle} ·{' '}
                        {characters.filter((c) => c.destinationId === destination.id).length} encounters
                      </p>
                    </div>
                  </div>

                  <div className="row" style={{ gap: 'var(--s-3)' }}>
                    <span className="row" style={{ gap: 4 }}>
                      {[destination.palette.deep, destination.palette.mid, destination.palette.glow].map((c) => (
                        <span
                          key={c}
                          className="map__swatch"
                          style={{ background: c, width: 18, height: 18, border: '1px solid var(--line)' }}
                          title={c}
                        />
                      ))}
                    </span>
                    <Button size="sm" variant="quiet" icon="pencil" onClick={() => setEditingDestination(destination)}>
                      Edit
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : null}

        {/* Milestones ---------------------------------------------------- */}
        {tab === 'milestones' ? (
          <Card flush>
            <div className="row row--between" style={{ padding: 'var(--s-4) var(--s-5)' }}>
              <p className="card__label">Distance markers, independent of the route.</p>
              <Button
                size="sm"
                variant="accent"
                icon="plus"
                onClick={() =>
                  setEditingMilestone({ id: `m_${Date.now()}`, name: 'New marker', requiredMiles: 100, description: '' })
                }
              >
                New milestone
              </Button>
            </div>
            <div className="tablewrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th className="num">Miles</th>
                    <th>Description</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {milestones.map((milestone) => (
                    <tr key={milestone.id}>
                      <td style={{ fontWeight: 600 }}>{milestone.name}</td>
                      <td className="num">{formatInt(milestone.requiredMiles)}</td>
                      <td className="muted">{milestone.description}</td>
                      <td>
                        <div className="row" style={{ gap: 4, justifyContent: 'flex-end' }}>
                          <Button size="sm" variant="ghost" icon="pencil" aria-label={`Edit ${milestone.name}`} onClick={() => setEditingMilestone(milestone)} />
                          <Button
                            size="sm"
                            variant="ghost"
                            icon="trash"
                            aria-label={`Delete ${milestone.name}`}
                            onClick={() => store.deleteMilestone(milestone.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : null}

        {/* Encounters ---------------------------------------------------- */}
        {tab === 'encounters' ? (
          <Card flush>
            <div className="tablewrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Character</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th className="num">Rating</th>
                    <th>Notes</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {store.encounters.map((encounter) => (
                    <tr key={encounter.id}>
                      <td style={{ fontWeight: 600 }}>
                        {characters.find((c) => c.id === encounter.characterId)?.name ?? encounter.characterId}
                      </td>
                      <td className="muted">{formatDateLong(encounter.date)}</td>
                      <td className="muted">{encounter.location || '—'}</td>
                      <td className="num">{encounter.rating ?? '—'}</td>
                      <td className="muted" style={{ maxWidth: 320 }}>
                        {encounter.notes || <em>None</em>}
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon="trash"
                          aria-label="Delete encounter"
                          onClick={() => store.deleteEncounter(encounter.id)}
                          style={{ marginLeft: 'auto' }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : null}

        {/* Activity ------------------------------------------------------ */}
        {tab === 'activity' ? (
          <Card flush>
            <div className="row row--between" style={{ padding: 'var(--s-4) var(--s-5)' }}>
              <p className="card__label">Most recent 24 days · {formatInt(totals.steps)} steps lifetime</p>
            </div>
            <div className="tablewrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th className="num">Steps</th>
                    <th className="num">Miles</th>
                    <th className="num">Active</th>
                    <th>Source</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((activity) => (
                    <tr key={activity.id}>
                      <td>{formatDateLong(activity.date)}</td>
                      <td className="num">{formatInt(activity.steps)}</td>
                      <td className="num">{formatMiles(activity.miles, 2)}</td>
                      <td className="num">{activity.activeMinutes}m</td>
                      <td className="muted">{activity.source}</td>
                      <td>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon="trash"
                          aria-label={`Delete ${activity.date}`}
                          onClick={() => store.deleteActivity(activity.id)}
                          style={{ marginLeft: 'auto' }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : null}

        {/* Users --------------------------------------------------------- */}
        {tab === 'users' ? (
          <Card flush>
            <div className="tablewrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Handle</th>
                    <th className="num">Lifetime miles</th>
                    <th className="num">Weekly miles</th>
                    <th className="num">Encounters</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {communityMembers.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <span className="row" style={{ gap: 'var(--s-3)' }}>
                          <Avatar initials={member.initials} accent={member.accent} size={28} />
                          <span style={{ fontWeight: 600 }}>@{member.handle}</span>
                          {member.isSelf ? <Pill plain>you</Pill> : null}
                        </span>
                      </td>
                      <td className="num">{formatMiles(member.lifetimeMiles)}</td>
                      <td className="num">{formatMiles(member.weeklyMiles)}</td>
                      <td className="num">{member.charactersUnlocked}</td>
                      <td className="muted">{member.isSelf ? store.user.role : 'member'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : null}

        {/* Announcements ------------------------------------------------- */}
        {tab === 'announcements' ? (
          <div className="stack">
            <div className="row row--between">
              <p className="card__label">Shown to every account while active.</p>
              <Button
                size="sm"
                variant="accent"
                icon="plus"
                onClick={() =>
                  setEditingAnnouncement({
                    id: `an_${Date.now()}`,
                    title: '',
                    body: '',
                    publishedAt: store.today,
                    active: true,
                  })
                }
              >
                New announcement
              </Button>
            </div>

            {store.announcements.map((announcement) => (
              <Card key={announcement.id}>
                <div className="row row--between row--wrap" style={{ gap: 'var(--s-4)', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="row" style={{ gap: 'var(--s-3)' }}>
                      <h3 className="charcard__name">{announcement.title}</h3>
                      {announcement.active ? <Pill tone="complete">Live</Pill> : <Pill tone="locked">Draft</Pill>}
                    </div>
                    <p className="muted" style={{ fontSize: 'var(--text-sm)', marginTop: 8, lineHeight: 1.6 }}>
                      {announcement.body}
                    </p>
                    <p className="field__hint" style={{ marginTop: 8 }}>
                      {formatDateLong(announcement.publishedAt)}
                    </p>
                  </div>
                  <div className="row" style={{ gap: 4 }}>
                    <Button size="sm" variant="ghost" icon="pencil" aria-label="Edit announcement" onClick={() => setEditingAnnouncement(announcement)} />
                    <Button
                      size="sm"
                      variant="ghost"
                      icon="trash"
                      aria-label="Delete announcement"
                      onClick={() => store.deleteAnnouncement(announcement.id)}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : null}
      </div>

      {/* Editors --------------------------------------------------------- */}
      <CharacterEditor
        value={editingCharacter}
        destinations={destinations}
        onClose={() => setEditingCharacter(null)}
        onSave={(character) => {
          store.saveCharacter(character);
          setEditingCharacter(null);
          push({ title: `${character.name} saved`, icon: 'check' });
        }}
      />

      <DestinationEditor
        value={editingDestination}
        onClose={() => setEditingDestination(null)}
        onSave={(destination) => {
          store.saveDestination(destination);
          setEditingDestination(null);
          push({ title: `${destination.name} saved`, icon: 'check' });
        }}
      />

      <MilestoneEditor
        value={editingMilestone}
        onClose={() => setEditingMilestone(null)}
        onSave={(milestone) => {
          store.saveMilestone(milestone);
          setEditingMilestone(null);
          push({ title: `${milestone.name} saved`, icon: 'check' });
        }}
      />

      <AnnouncementEditor
        value={editingAnnouncement}
        onClose={() => setEditingAnnouncement(null)}
        onSave={(announcement) => {
          store.saveAnnouncement(announcement);
          setEditingAnnouncement(null);
          push({ title: 'Announcement saved', icon: 'megaphone' });
        }}
      />
    </div>
  );
}

/* Editors -------------------------------------------------------------------- */

function CharacterEditor({
  value,
  destinations,
  onClose,
  onSave,
}: {
  value: Character | null;
  destinations: Destination[];
  onClose: () => void;
  onSave: (character: Character) => void;
}) {
  const [draft, setDraft] = useState<Character | null>(value);
  if (value && draft?.id !== value.id) setDraft(value);
  if (!value || !draft) return null;

  return (
    <Modal
      open
      onClose={onClose}
      wide
      title={`Edit ${value.name}`}
      description="Distance is the length of this leg. Everything downstream shifts with it."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="accent" icon="check" onClick={() => onSave(draft)}>
            Save character
          </Button>
        </>
      }
    >
      <div className="stack">
        <div className="grid grid--2">
          <Field label="Name" htmlFor="c-name">
            <Input id="c-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </Field>
          <Field label="Epithet" htmlFor="c-epithet" hint="One line, shown on the card.">
            <Input id="c-epithet" value={draft.epithet} onChange={(e) => setDraft({ ...draft, epithet: e.target.value })} />
          </Field>
        </div>

        <Field label="Description" htmlFor="c-desc">
          <Textarea id="c-desc" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        </Field>

        <div className="grid grid--2">
          <Field label="Destination" htmlFor="c-dest">
            <Select id="c-dest" value={draft.destinationId} onChange={(e) => setDraft({ ...draft, destinationId: e.target.value })}>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Required miles" htmlFor="c-miles" hint="Steps are derived from the account stride.">
            <Input
              id="c-miles"
              className="input--numeric"
              inputMode="decimal"
              value={String(draft.requiredMiles)}
              onChange={(e) => setDraft({ ...draft, requiredMiles: Math.max(0, Number(e.target.value) || 0) })}
            />
          </Field>
        </div>

        <Field label="Note" htmlFor="c-note" hint="Optional. Shown as an aside on the encounter page.">
          <Input id="c-note" value={draft.note ?? ''} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
        </Field>

        <div>
          <p className="field__label" style={{ marginBottom: 8 }}>
            Artwork and silhouette
          </p>
          <div className="row row--wrap" style={{ gap: 'var(--s-4)', alignItems: 'flex-start' }}>
            <div style={{ width: 96 }}>
              <CharacterImage
                character={draft}
                destination={destinations.find((d) => d.id === draft.destinationId)}
                status="completed"
              />
            </div>
            <div style={{ width: 96 }}>
              <CharacterImage
                character={draft}
                destination={destinations.find((d) => d.id === draft.destinationId)}
                status="locked"
              />
            </div>
            <p className="field__hint" style={{ maxWidth: '34ch' }}>
              Unlocked and locked states of the same slot. Drop a file into{' '}
              <code>public/artwork/characters/</code> and register it in{' '}
              <code>src/data/artwork.ts</code> to replace the plate — the locked state becomes a
              silhouette of that artwork automatically.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function DestinationEditor({
  value,
  onClose,
  onSave,
}: {
  value: Destination | null;
  onClose: () => void;
  onSave: (destination: Destination) => void;
}) {
  const [draft, setDraft] = useState<Destination | null>(value);
  if (value && draft?.id !== value.id) setDraft(value);
  if (!value || !draft) return null;

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit ${value.name}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="accent" icon="check" onClick={() => onSave(draft)}>
            Save destination
          </Button>
        </>
      }
    >
      <div className="stack">
        <Field label="Name" htmlFor="d-name">
          <Input id="d-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </Field>
        <Field label="Subtitle" htmlFor="d-sub">
          <Input id="d-sub" value={draft.subtitle} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} />
        </Field>
        <Field label="Description" htmlFor="d-desc">
          <Textarea id="d-desc" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        </Field>

        <div className="grid grid--3">
          {(['deep', 'mid', 'glow'] as const).map((key) => (
            <Field key={key} label={key} htmlFor={`d-${key}`}>
              <Input
                id={`d-${key}`}
                type="color"
                value={draft.palette[key]}
                onChange={(e) => setDraft({ ...draft, palette: { ...draft.palette, [key]: e.target.value } })}
                style={{ padding: 4, height: 42 }}
              />
            </Field>
          ))}
        </div>
        <p className="field__hint">
          These three tones drive every portrait in the destination and its region on the map.
        </p>
      </div>
    </Modal>
  );
}

function MilestoneEditor({
  value,
  onClose,
  onSave,
}: {
  value: Milestone | null;
  onClose: () => void;
  onSave: (milestone: Milestone) => void;
}) {
  const [draft, setDraft] = useState<Milestone | null>(value);
  if (value && draft?.id !== value.id) setDraft(value);
  if (!value || !draft) return null;

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit milestone"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="accent" icon="check" onClick={() => onSave(draft)}>
            Save milestone
          </Button>
        </>
      }
    >
      <div className="stack">
        <Field label="Name" htmlFor="m-name">
          <Input id="m-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </Field>
        <Field label="Required miles" htmlFor="m-miles">
          <Input
            id="m-miles"
            className="input--numeric"
            inputMode="numeric"
            value={String(draft.requiredMiles)}
            onChange={(e) => setDraft({ ...draft, requiredMiles: Math.max(1, Number(e.target.value) || 1) })}
          />
        </Field>
        <Field label="Description" htmlFor="m-desc">
          <Textarea id="m-desc" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        </Field>
      </div>
    </Modal>
  );
}

function AnnouncementEditor({
  value,
  onClose,
  onSave,
}: {
  value: Announcement | null;
  onClose: () => void;
  onSave: (announcement: Announcement) => void;
}) {
  const [draft, setDraft] = useState<Announcement | null>(value);
  if (value && draft?.id !== value.id) setDraft(value);
  if (!value || !draft) return null;

  return (
    <Modal
      open
      onClose={onClose}
      title="Announcement"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="accent" icon="check" onClick={() => onSave(draft)}>
            Save
          </Button>
        </>
      }
    >
      <div className="stack">
        <Field label="Title" htmlFor="a-title">
          <Input id="a-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        </Field>
        <Field label="Body" htmlFor="a-body">
          <Textarea id="a-body" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
        </Field>
        <div className="grid grid--2">
          <Field label="Published" htmlFor="a-date">
            <Input
              id="a-date"
              type="date"
              value={draft.publishedAt}
              onChange={(e) => setDraft({ ...draft, publishedAt: e.target.value })}
            />
          </Field>
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 10 }}>
            <Switch
              id="a-active"
              checked={draft.active}
              onChange={(active) => setDraft({ ...draft, active })}
              label="Live for all accounts"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
