import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useJourney, useStore } from '@/state/store';
import { useDocumentMeta } from '@/hooks';
import { useToast } from '@/state/toast';
import { CharacterImage } from '@/components/media';
import { ProgressBar, ProgressRing, Metric } from '@/components/domain/Progress';
import { Rating } from '@/components/domain/EncounterCard';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card, Field, Input, Pill, StatusPill, Textarea } from '@/components/ui/Primitives';
import { Modal } from '@/components/ui/Modal';
import { Icon } from '@/components/ui/Icon';
import { formatDateLong, formatInt, formatMiles } from '@/lib/format';

const MAX_PHOTO_BYTES = 4_000_000;

export function CharacterPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { destinations, saveEncounter, deleteEncounter, today } = useStore();
  const { progress } = useJourney();
  const { push } = useToast();

  const entry = useMemo(() => progress.find((p) => p.character.id === id) ?? null, [progress, id]);
  const previous = entry ? progress[entry.index - 1] ?? null : null;
  const next = entry ? progress[entry.index + 1] ?? null : null;
  const destination = destinations.find((d) => d.id === entry?.character.destinationId);

  const [editing, setEditing] = useState(false);

  useDocumentMeta(
    entry
      ? `${entry.status === 'locked' ? 'Locked encounter' : entry.character.name} · Milepost`
      : 'Encounter not found · Milepost',
    entry && entry.status !== 'locked'
      ? `${entry.character.name} — ${entry.character.epithet}. ${formatMiles(entry.character.requiredMiles)} miles of walking to reach this encounter.`
      : undefined,
  );

  if (!entry) {
    return (
      <div className="page">
        <div className="state" role="alert">
          <span className="state__art">
            <Icon name="compass" size={30} />
          </span>
          <h1 className="state__title">We lost the trail.</h1>
          <p className="state__body">There is no encounter at that address.</p>
          <div className="state__actions">
            <ButtonLink to="/characters" variant="primary">
              Back to characters
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  const { character, status, percentage, currentMiles, currentSteps, requiredSteps, unlockedAt, encounter } = entry;
  const unlocked = status === 'ready' || status === 'completed';
  const locked = status === 'locked';

  return (
    <div className="page">
      <div className="row row--between row--wrap" style={{ marginBottom: 'var(--s-5)' }}>
        <Link to="/characters" className="section__link">
          <Icon name="arrowLeft" size={14} /> All characters
        </Link>
        <div className="row" style={{ gap: 6 }}>
          {previous ? (
            <Button
              size="sm"
              variant="ghost"
              icon="chevronLeft"
              onClick={() => navigate(`/characters/${previous.character.id}`)}
              aria-label="Previous encounter"
            />
          ) : null}
          <span className="muted numeric" style={{ fontSize: 'var(--text-xs)' }}>
            {String(entry.index + 1).padStart(2, '0')} / {String(progress.length).padStart(2, '0')}
          </span>
          {next ? (
            <Button
              size="sm"
              variant="ghost"
              icon="chevronRight"
              onClick={() => navigate(`/characters/${next.character.id}`)}
              aria-label="Next encounter"
            />
          ) : null}
        </div>
      </div>

      {/* The encounter itself --------------------------------------------- */}
      <section className="encounter grain">
        <div className="encounter__grid">
          <div className="encounter__art reveal-in">
            <CharacterImage
              character={character}
              destination={destination}
              status={status}
              index={entry.index}
              priority
            />
          </div>

          <div>
            <div className="row row--wrap reveal-in reveal-in--2" style={{ gap: 'var(--s-2)' }}>
              <Pill plain>{destination?.name}</Pill>
              <StatusPill status={status} />
              {character.note ? <Pill tone="gold">Hidden encounter</Pill> : null}
            </div>

            <p className="eyebrow reveal-in reveal-in--2" style={{ marginTop: 'var(--s-5)' }}>
              {unlocked ? 'Encounter unlocked' : locked ? 'Not yet reached' : 'Encounter in progress'}
            </p>

            <h1 className="encounter__title reveal-in reveal-in--3">
              {locked ? 'Someone is waiting.' : character.name}
            </h1>

            <p className="encounter__quote reveal-in reveal-in--3">
              {unlocked
                ? `You walked ${formatMiles(character.requiredMiles)} miles to get here.`
                : locked
                  ? `${formatMiles(entry.startMiles)} miles of route stand between you and finding out who.`
                  : `${formatMiles(entry.milesRemaining)} miles left. Almost.`}
            </p>

            {!locked ? (
              <p className="muted reveal-in reveal-in--4" style={{ marginTop: 'var(--s-4)', maxWidth: '52ch', lineHeight: 1.65 }}>
                {character.description}
              </p>
            ) : null}

            <div className="encounter__facts reveal-in reveal-in--4">
              <span className="encounter__fact">
                <span className="encounter__factval">
                  <Metric value={unlocked ? character.requiredMiles : currentMiles} decimals={1} />
                </span>
                <span className="journey__statlabel">{unlocked ? 'Miles walked' : 'Miles so far'}</span>
              </span>
              <span className="encounter__fact">
                <span className="encounter__factval">
                  <Metric value={unlocked ? requiredSteps : currentSteps} />
                </span>
                <span className="journey__statlabel">Steps</span>
              </span>
              <span className="encounter__fact">
                <span className="encounter__factval">
                  {unlockedAt ? formatDateLong(unlockedAt) : <span className="muted">Not yet</span>}
                </span>
                <span className="journey__statlabel">Date unlocked</span>
              </span>
            </div>

            {!unlocked ? (
              <div style={{ marginTop: 'var(--s-6)', maxWidth: 460 }}>
                <div className="row row--between" style={{ marginBottom: 8 }}>
                  <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
                    {formatMiles(currentMiles)} / {formatMiles(character.requiredMiles)} mi
                  </span>
                  <span className="charcard__pct">{(percentage * 100).toFixed(1)}%</span>
                </div>
                <ProgressBar value={percentage} thickness="thick" ariaLabel="Encounter progress" />
              </div>
            ) : (
              <div className="row row--wrap" style={{ marginTop: 'var(--s-6)', gap: 'var(--s-2)' }}>
                <Button variant="accent" icon={encounter ? 'pencil' : 'check'} onClick={() => setEditing(true)}>
                  {encounter ? 'Edit your notes' : 'Mark as completed'}
                </Button>
                {next ? (
                  <ButtonLink to={`/characters/${next.character.id}`} iconAfter="arrowRight">
                    Next encounter
                  </ButtonLink>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Logged record ----------------------------------------------------- */}
      {encounter ? (
        <section className="section">
          <div className="section__head">
            <h2 className="section__title">Your record</h2>
            <Button size="sm" variant="ghost" icon="pencil" onClick={() => setEditing(true)}>
              Edit
            </Button>
          </div>

          <div className="grid grid--split">
            <Card>
              <div className="grid grid--2" style={{ gap: 'var(--s-5)' }}>
                <div>
                  <p className="card__label">Date met</p>
                  <p className="journey__statval" style={{ marginTop: 6 }}>
                    {formatDateLong(encounter.date)}
                  </p>
                </div>
                <div>
                  <p className="card__label">Location</p>
                  <p className="journey__statval" style={{ marginTop: 6 }}>
                    {encounter.location || <span className="muted">Not recorded</span>}
                  </p>
                </div>
                <div>
                  <p className="card__label">Your rating</p>
                  <div style={{ marginTop: 8 }}>
                    <Rating value={encounter.rating} />
                  </div>
                </div>
                <div>
                  <p className="card__label">Steps to get here</p>
                  <p className="journey__statval numeric" style={{ marginTop: 6 }}>
                    {formatInt(requiredSteps)}
                  </p>
                </div>
              </div>

              {encounter.notes ? (
                <>
                  <p className="card__label" style={{ marginTop: 'var(--s-6)' }}>
                    Notes
                  </p>
                  <p style={{ marginTop: 8, lineHeight: 1.65, fontSize: 'var(--text-md)' }} className="serif">
                    {encounter.notes}
                  </p>
                </>
              ) : null}
            </Card>

            <Card>
              <p className="card__label">Photo</p>
              {encounter.photo ? (
                <img
                  src={encounter.photo}
                  alt={`Your encounter with ${character.name}`}
                  style={{ marginTop: 12, borderRadius: 'var(--r-md)', width: '100%' }}
                />
              ) : (
                <button type="button" className="photodrop" style={{ marginTop: 12 }} onClick={() => setEditing(true)}>
                  <Icon name="camera" size={22} />
                  Add a photo
                </button>
              )}
            </Card>
          </div>
        </section>
      ) : null}

      {/* Where this sits on the route -------------------------------------- */}
      <section className="section">
        <div className="section__head">
          <h2 className="section__title">On the route</h2>
          <Link to="/map" className="section__link">
            Open the map <Icon name="arrowRight" size={14} />
          </Link>
        </div>

        <Card>
          <div className="row row--wrap" style={{ gap: 'var(--s-8)', alignItems: 'center' }}>
            <ProgressRing value={percentage} size={116} label="This leg" tone={unlocked ? 'moss' : 'ember'} />
            <div className="grid grid--2" style={{ flex: 1, minWidth: 240, gap: 'var(--s-5)' }}>
              <div>
                <p className="card__label">Leg begins at</p>
                <p className="journey__statval numeric" style={{ marginTop: 6 }}>
                  {formatMiles(entry.startMiles)} mi
                </p>
              </div>
              <div>
                <p className="card__label">Leg ends at</p>
                <p className="journey__statval numeric" style={{ marginTop: 6 }}>
                  {formatMiles(entry.endMiles)} mi
                </p>
              </div>
              <div>
                <p className="card__label">Distance required</p>
                <p className="journey__statval numeric" style={{ marginTop: 6 }}>
                  {formatMiles(character.requiredMiles)} mi
                </p>
              </div>
              <div>
                <p className="card__label">Steps required</p>
                <p className="journey__statval numeric" style={{ marginTop: 6 }}>
                  {formatInt(requiredSteps)}
                </p>
              </div>
            </div>
          </div>

          {character.note ? (
            <p className="muted" style={{ marginTop: 'var(--s-5)', fontSize: 'var(--text-sm)', fontStyle: 'italic' }}>
              {character.note}
            </p>
          ) : null}
        </Card>
      </section>

      <EncounterEditor
        open={editing}
        onClose={() => setEditing(false)}
        characterName={character.name}
        today={today}
        initial={
          encounter ?? {
            characterId: character.id,
            date: unlockedAt ?? today,
            location: '',
            photo: null,
            notes: '',
            rating: null,
          }
        }
        onSave={(value) => {
          saveEncounter({ ...value, characterId: character.id });
          setEditing(false);
          push({
            title: encounter ? 'Encounter updated' : 'Encounter logged',
            body: `${character.name} is in your history.`,
            icon: 'sparkle',
          });
        }}
        onDelete={
          encounter
            ? () => {
                deleteEncounter(encounter.id);
                setEditing(false);
                push({ title: 'Record removed', body: 'The encounter is unlocked but unlogged again.', icon: 'alert' });
              }
            : undefined
        }
      />
    </div>
  );
}

/* Editor --------------------------------------------------------------------- */

interface EditorValue {
  characterId: string;
  date: string;
  location: string;
  photo: string | null;
  notes: string;
  rating: number | null;
}

function EncounterEditor({
  open,
  onClose,
  onSave,
  onDelete,
  initial,
  characterName,
  today,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (value: EditorValue) => void;
  onDelete?: () => void;
  initial: EditorValue;
  characterName: string;
  today: string;
}) {
  const [value, setValue] = useState<EditorValue>(initial);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue(initial);
      setPhotoError(null);
    }
    // `initial` is rebuilt each render; the open transition is the real trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onPickPhoto = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError('That image is over 4 MB. Pick a smaller one.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setValue((v) => ({ ...v, photo: String(reader.result) }));
    reader.onerror = () => setPhotoError('That image could not be read.');
    reader.readAsDataURL(file);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Log your encounter with ${characterName}`}
      description="Kept on this device. Nothing is uploaded anywhere."
      wide
      footer={
        <>
          {onDelete ? (
            <Button variant="danger" icon="trash" onClick={onDelete} style={{ marginRight: 'auto' }}>
              Remove
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="accent" icon="check" onClick={() => onSave(value)}>
            Save encounter
          </Button>
        </>
      }
    >
      <div className="stack">
        <div className="grid grid--2">
          <Field label="Date" htmlFor="enc-date">
            <Input
              id="enc-date"
              type="date"
              max={today}
              value={value.date}
              onChange={(e) => setValue((v) => ({ ...v, date: e.target.value }))}
            />
          </Field>
          <Field label="Location" htmlFor="enc-location" hint="Where you were when you got there.">
            <Input
              id="enc-location"
              placeholder="Riverside Loop"
              value={value.location}
              onChange={(e) => setValue((v) => ({ ...v, location: e.target.value }))}
            />
          </Field>
        </div>

        <Field label="Notes" htmlFor="enc-notes" hint="What the walk was like. Future you will want this.">
          <Textarea
            id="enc-notes"
            placeholder="Finished this one in the rain and did not mind at all."
            value={value.notes}
            onChange={(e) => setValue((v) => ({ ...v, notes: e.target.value }))}
          />
        </Field>

        <div className="grid grid--2">
          <Field label="How was it?" error={undefined}>
            <div style={{ paddingTop: 6 }}>
              <Rating value={value.rating} size={22} onChange={(rating) => setValue((v) => ({ ...v, rating }))} />
            </div>
          </Field>

          <Field label="Photo" error={photoError ?? undefined} hint={photoError ? undefined : 'Optional, up to 4 MB.'}>
            <button type="button" className="photodrop" onClick={() => fileInput.current?.click()}>
              {value.photo ? (
                <img src={value.photo} alt="Selected" />
              ) : (
                <>
                  <Icon name="camera" size={22} />
                  Choose an image
                </>
              )}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => onPickPhoto(e.target.files?.[0])}
            />
            {value.photo ? (
              <Button size="sm" variant="ghost" icon="close" onClick={() => setValue((v) => ({ ...v, photo: null }))}>
                Remove photo
              </Button>
            ) : null}
          </Field>
        </div>
      </div>
    </Modal>
  );
}
