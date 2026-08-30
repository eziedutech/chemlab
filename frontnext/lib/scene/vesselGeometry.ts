/**
 * Measuring cylinder dimensions, in scene units.
 *
 * Tall and narrow, the way a real graduated cylinder is: that shape is what
 * makes a volume readable to a fraction of a division, which is the reason the
 * lab uses one instead of just eyeballing the beaker.
 */

/** Sized to the imported measuring cylinder, 20.63 cm tall by 5.29 across. */
export const CYLINDER_RADIUS = 0.105;
export const CYLINDER_HEIGHT = 0.82;
export const CYLINDER_BASE = 0.022;
export const CYLINDER_MAX_ML = 250;
export const CYLINDER_MAX_LIQUID = CYLINDER_HEIGHT * 0.86;

/** Height of the liquid surface inside a measuring cylinder. */
export function cylinderSurfaceHeight(volumeMl: number): number {
  const ratio = Math.min(1, Math.max(0, volumeMl / CYLINDER_MAX_ML));
  return CYLINDER_BASE + ratio * CYLINDER_MAX_LIQUID;
}

/** Bench slot for the nth vessel of a batch, laid out left of the beaker. */
export function vesselSlot(index: number, total: number): [number, number, number] {
  const spacing = 0.42;
  const firstX = -0.98 - spacing * (total - 1);
  return [firstX + spacing * index, 0, 0.42];
}
