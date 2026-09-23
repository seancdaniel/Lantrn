/**
 * Artwork manifest.
 *
 * The interface never draws a character. It renders whatever image asset is registered
 * here, and falls back to a designed plate when none is. To add real illustration:
 *
 *   1. Drop the file in `public/artwork/characters/` (WebP preferred, 1000×1250, 4:5).
 *   2. Add one line below.
 *
 * Nothing else changes — the container, aspect ratio, cropping and every state
 * treatment already exist. An entry that 404s falls back to the plate rather than
 * showing a broken image.
 */

export const CHARACTER_ARTWORK_DIR = '/artwork/characters';
export const DESTINATION_ARTWORK_DIR = '/artwork/destinations';

/** characterId → filename in `public/artwork/characters/`. */
export const characterArtwork: Record<string, string> = {
  letterbearer: 'letterbearer.webp',
};

/** destinationId → filename in `public/artwork/destinations/`. */
export const destinationArtwork: Record<string, string> = {};

export function characterArtworkSrc(characterId: string): string | null {
  const file = characterArtwork[characterId];
  return file ? `${CHARACTER_ARTWORK_DIR}/${file}` : null;
}

export function destinationArtworkSrc(destinationId: string): string | null {
  const file = destinationArtwork[destinationId];
  return file ? `${DESTINATION_ARTWORK_DIR}/${file}` : null;
}

/** The letter shown on a plate awaiting artwork. Leading articles are not initials. */
export function monogram(name: string): string {
  const word = name.replace(/^(the|a|an)\s+/i, '').trim();
  return (word[0] ?? '?').toUpperCase();
}
