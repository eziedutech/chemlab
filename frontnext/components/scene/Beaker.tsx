"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, DoubleSide } from "three";
import {
  BASE_HEIGHT,
  FULL_VOLUME_ML,
  OUTER_RADIUS,
  surfaceHeight,
  WALL_HEIGHT,
} from "../../lib/scene/beakerGeometry";
import { createBeakerGeometry } from "../../lib/scene/glassProfiles";
import { createScaleTexture } from "../../lib/scene/scaleTexture";
import { Bubbles } from "./Bubbles";
import { LabGlass, useRefractingGlass } from "./LabGlass";
import { Liquid } from "./Liquid";

/**
 * Volume scale printed on the glass. Ticks sit at the height the liquid
 * actually reaches for that volume, so a student can read the level off the
 * marks instead of guessing.
 */
function useGraduationTexture(): CanvasTexture | null {
  const texture = useMemo(
    () =>
      createScaleTexture({
        wallHeight: WALL_HEIGHT,
        radius: OUTER_RADIUS,
        maxMl: FULL_VOLUME_ML,
        minorEveryMl: 10,
        majorEveryMl: 50,
        surfaceHeight,
      }),
    [],
  );

  useEffect(() => () => texture?.dispose(), [texture]);

  return texture;
}

/**
 * A laboratory beaker built from primitives: an open ended wall, a base disc,
 * a rim, the printed volume scale, and the liquid inside it.
 *
 * The glass material is shared with the measuring cylinders, so the whole
 * bench costs one transmission pass rather than one each.
 */
export function Beaker() {
  const graduations = useGraduationTexture();
  const refracting = useRefractingGlass();
  const glass = useMemo(
    () => createBeakerGeometry(OUTER_RADIUS, WALL_HEIGHT),
    [],
  );
  useEffect(() => () => glass.dispose(), [glass]);

  return (
    <group>
      {/* The glass, turned on a lathe the way the real thing is: a wall with
          an outer face and an inner one, so refraction has something to bend
          through. */}
      <mesh geometry={glass}>
        <LabGlass refracting={refracting} />
      </mesh>

      {/* Printed volume scale, on a shell just outside the glass. */}
      {graduations && (
        <mesh position={[0, WALL_HEIGHT / 2, 0]} rotation={[0, -0.35, 0]}>
          <cylinderGeometry
            args={[OUTER_RADIUS + 0.004, OUTER_RADIUS + 0.004, WALL_HEIGHT, 48, 1, true]}
          />
          <meshBasicMaterial
            map={graduations}
            transparent
            depthWrite={false}
            side={DoubleSide}
          />
        </mesh>
      )}

      <Liquid />
      <Bubbles />
    </group>
  );
}
