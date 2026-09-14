import { Link } from 'react-router-dom';
import type { CharacterProgress, Destination } from '@/types';
import { CharacterImage } from '@/components/media';
import { Icon } from '@/components/ui/Icon';
import { formatDateLong } from '@/lib/format';

export function Rating({
  value,
  onChange,
  size = 16,
}: {
  value: number | null;
  onChange?: (next: number) => void;
  size?: number;
}) {
  const stars = [1, 2, 3, 4, 5];

  if (!onChange) {
    return (
      <span className="rating" role="img" aria-label={value ? `Rated ${value} of 5` : 'Not rated'}>
        {stars.map((star) => (
          <span key={star} className={`rating__star${value && star <= value ? ' rating__star--on' : ''}`}>
            <Icon name="star" size={size} />
          </span>
        ))}
      </span>
    );
  }

  return (
    <span className="rating">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          className={`rating__star${value && star <= value ? ' rating__star--on' : ''}`}
          onClick={() => onChange(star)}
          aria-label={`Rate ${star} of 5`}
          aria-pressed={value === star}
        >
          <Icon name="star" size={size} />
        </button>
      ))}
    </span>
  );
}

/** A logged encounter as it appears in the personal history. */
export function EncounterCard({
  entry,
  destination,
}: {
  entry: CharacterProgress;
  destination?: Destination;
}) {
  const { character, encounter, unlockedAt } = entry;

  return (
    <article className="charcard" style={{ flexDirection: 'row' }}>
      <div style={{ width: 96, flex: 'none' }}>
        <CharacterImage character={character} destination={destination} status="completed" />
      </div>

      <div className="charcard__body">
        <div className="charcard__eyebrow">
          <span className="charcard__seq">{destination?.name}</span>
          {encounter?.rating ? <Rating value={encounter.rating} size={13} /> : null}
        </div>

        <div>
          <h3 className="charcard__name">
            <Link to={`/characters/${character.id}`} className="charcard__link">
              {character.name}
            </Link>
          </h3>
          <p className="charcard__epithet">
            {encounter ? formatDateLong(encounter.date) : unlockedAt ? formatDateLong(unlockedAt) : '—'}
            {encounter?.location ? ` · ${encounter.location}` : ''}
          </p>
        </div>

        {encounter?.notes ? (
          <p className="charcard__epithet" style={{ marginTop: 'auto' }}>
            {encounter.notes}
          </p>
        ) : null}
      </div>
    </article>
  );
}
