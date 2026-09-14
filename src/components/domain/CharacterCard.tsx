import { Link } from 'react-router-dom';
import type { CharacterProgress, Destination } from '@/types';
import { CharacterImage } from '@/components/media';
import { ProgressBar } from './Progress';
import { StatusPill } from '@/components/ui/Primitives';
import { formatMiles } from '@/lib/format';

/**
 * Fixed structure, every time: media, content, then progress at the base.
 * Nothing overlaps because nothing is positioned — the card is a flex column and
 * the progress block is pushed down with `margin-top: auto`, so a row of cards
 * shares one baseline whatever the descriptions do.
 */
export function CharacterCard({
  entry,
  destination,
}: {
  entry: CharacterProgress;
  destination?: Destination;
}) {
  const { character, status, percentage, currentMiles, milesRemaining } = entry;
  const locked = status === 'locked';
  const reached = status === 'completed' || status === 'ready';

  return (
    <article className="charcard">
      <div className="charcard__media">
        <CharacterImage
          character={character}
          destination={destination}
          status={status}
          index={entry.index}
        />
      </div>

      <div className="charcard__body">
        <div className="charcard__eyebrow">
          <span className="charcard__seq">Encounter {String(entry.index + 1).padStart(2, '0')}</span>
          <StatusPill status={status} />
        </div>

        <div>
          <h3 className="charcard__name">
            <Link to={`/characters/${character.id}`} className="charcard__link">
              {locked ? 'Not yet identified' : character.name}
            </Link>
          </h3>
          <p className="charcard__epithet">
            {locked ? 'Keep walking and find out who is waiting.' : character.epithet}
          </p>
        </div>

        <div className="charcard__progress">
          <div className="charcard__readout">
            <span>
              {formatMiles(currentMiles)} / {formatMiles(character.requiredMiles)} miles
            </span>
            <span className="charcard__pct">{(percentage * 100).toFixed(1)}%</span>
          </div>

          <ProgressBar
            value={percentage}
            thickness="thin"
            tone={status === 'completed' ? 'moss' : 'ember'}
            ariaLabel={`${locked ? 'Locked encounter' : character.name} progress`}
          />

          <p className="charcard__remaining">
            {reached ? 'Encounter reached' : `${formatMiles(milesRemaining)} miles remaining`}
          </p>
        </div>
      </div>
    </article>
  );
}

export function CharacterCardSkeleton() {
  return (
    <article className="charcard" aria-hidden="true">
      <div className="charcard__media">
        <span className="skeleton" style={{ display: 'block', aspectRatio: '4 / 5' }} />
      </div>
      <div className="charcard__body">
        <span className="skeleton" style={{ display: 'block', height: 10, width: '45%' }} />
        <span className="skeleton" style={{ display: 'block', height: 18, width: '70%' }} />
        <span className="skeleton" style={{ display: 'block', height: 12, width: '90%' }} />
        <div className="charcard__progress">
          <span className="skeleton" style={{ display: 'block', height: 4, width: '100%' }} />
        </div>
      </div>
    </article>
  );
}
