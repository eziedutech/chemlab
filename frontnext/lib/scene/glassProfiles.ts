import { LatheGeometry, Vector2 } from "three";

/**
 * Glassware built here rather than imported.
 *
 * Laboratory glass is turned on a lathe in real life, and it is turned on a
 * lathe here too: a profile is drawn once and revolved. That gives the two
 * things an imported shell cannot. The wall has real thickness, an outer
 * surface and an inner one, which is what refraction needs to look like glass
 * instead of like a soap bubble. And the dimensions are ours, so the printed
 * scale and the liquid line up exactly rather than approximately.
 */

/** Sides around the revolution. Enough to look round, few enough to be cheap. */
const SEGMENTS = 48;

function lathe(points: [number, number][]): LatheGeometry {
  const geometry = new LatheGeometry(
    points.map(([radius, height]) => new Vector2(radius, height)),
    SEGMENTS,
  );
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * A beaker: straight sided, slightly flared at the lip, with a thick base.
 *
 * The profile runs up the outside, over the rim, back down the inside, and
 * across the floor, so the glass is a wall with two faces rather than one.
 */
export function createBeakerGeometry(
  outerRadius: number,
  height: number,
): LatheGeometry {
  const wall = outerRadius * 0.045;
  const floor = height * 0.055;
  const lip = outerRadius * 1.02;

  return lathe([
    [0, 0],
    [outerRadius * 0.94, 0],
    [outerRadius, height * 0.02],
    [outerRadius, height * 0.965],
    [lip, height * 0.99],
    [lip * 0.995, height],
    [lip - wall, height * 0.995],
    [outerRadius - wall, height * 0.96],
    [outerRadius - wall, floor],
    [0, floor],
  ]);
}

/**
 * A measuring cylinder: tall and narrow on a wide foot, with a pouring lip.
 *
 * The foot is what stops a cylinder this slender from reading as a candle, so
 * it is modelled rather than implied.
 */
export function createCylinderGeometry(
  outerRadius: number,
  height: number,
): LatheGeometry {
  const wall = outerRadius * 0.09;
  const footRadius = outerRadius * 1.85;
  const footHeight = height * 0.045;
  const floor = footHeight + height * 0.02;

  return lathe([
    [0, 0],
    [footRadius, 0],
    [footRadius, footHeight * 0.55],
    [footRadius * 0.92, footHeight],
    [outerRadius * 1.05, footHeight * 1.9],
    [outerRadius, footHeight * 2.6],
    [outerRadius, height * 0.965],
    [outerRadius * 1.06, height * 0.99],
    [outerRadius * 1.05, height],
    [outerRadius - wall, height * 0.99],
    [outerRadius - wall, floor],
    [0, floor],
  ]);
}
