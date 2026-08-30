/**
 * Beaker dimensions in scene units, shared by everything that has to line up
 * with the glass: the printed scale, the liquid, and the pouring stream.
 */

export const OUTER_RADIUS = 0.5;
export const WALL_HEIGHT = 0.92;
export const BASE_HEIGHT = 0.024;
export const LIQUID_RADIUS = OUTER_RADIUS - 0.025;

/** Volume that fills the beaker to the brim, used to map millilitres to height. */
export const FULL_VOLUME_ML = 250;
export const MAX_LIQUID_HEIGHT = WALL_HEIGHT * 0.82;

/** World height of the liquid surface for a given volume. */
export function surfaceHeight(volumeMl: number): number {
  const ratio = Math.min(1, Math.max(0, volumeMl / FULL_VOLUME_ML));
  return BASE_HEIGHT + ratio * MAX_LIQUID_HEIGHT;
}
