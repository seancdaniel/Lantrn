import type { Character, CharacterStatus, Destination } from '@/types';
import { characterArtworkSrc, monogram } from '@/data/artwork';
import { Icon } from '@/components/ui/Icon';
import { ImageFrame, type Ratio } from './ImageFrame';

interface Props {
  character: Character;
  destination?: Destination;
  status: CharacterStatus;
  /** Encounter number, shown on the plate when no artwork exists. */
  index?: number;
  ratio?: Ratio;
  priority?: boolean;
  className?: string;
}

/**
 * A character's visual slot.
 *
 * Where an illustration has been supplied it is shown as an image — and a locked
 * encounter renders that same image as a true silhouette, which is a filter on real
 * artwork rather than a second drawing that can fall out of register.
 *
 * Where no illustration exists yet, the slot shows a designed plate: a tonal field
 * carrying the encounter's monogram, or a lock for one not yet reached. The plate is
 * typographic on purpose. Drawing a figure in code is what made this look generated.
 */
export function CharacterImage({
  character,
  destination,
  status,
  index,
  ratio = 'portrait',
  priority,
  className,
}: Props) {
  const src = characterArtworkSrc(character.id);
  const locked = status === 'locked';
  const palette = destination?.palette;

  const tint = palette
    ? { '--plate-tint': palette.mid, '--plate-glow': palette.glow } as React.CSSProperties
    : undefined;

  return (
    <ImageFrame
      src={src}
      alt={locked ? 'Encounter artwork, not yet unlocked' : `${character.name}, illustrated`}
      ratio={ratio}
      fit="cover"
      priority={priority}
      className={['charimg', locked ? 'charimg--locked' : '', className].filter(Boolean).join(' ')}
      fallback={
        <div className="plate" style={tint} role="img" aria-label={locked ? 'Artwork locked' : `${character.name}, artwork pending`}>
          {locked ? (
            <span className="plate__lock">
              <Icon name="lock" size={20} />
            </span>
          ) : (
            <span className="plate__monogram" aria-hidden="true">
              {monogram(character.name)}
            </span>
          )}
          {index !== undefined ? (
            <span className="plate__index" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
          ) : null}
        </div>
      }
    />
  );
}
