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
import { createScaleTexture } from "../../lib/scene/scaleTexture";
import { Bubbles } from "./Bubbles";
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
 * The glass is a transparent physical material rather than a transmissive one.
 * Transmission renders the scene a second time per frame, which is exactly the
 * cost a school laptop cannot absorb, and at this scale it buys very little.
 */
export function Beaker() {
  const graduations = useGraduationTexture();

  return (
    <group>
      {/* Glass wall, open at both ends so it reads as hollow. */}
      <mesh position={[0, WALL_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[OUTER_RADIUS, OUTER_RADIUS, WALL_HEIGHT, 48, 1, true]} />
        <meshPhysicalMaterial
          color="#cfe4f2"
          transparent
          opacity={0.22}
          roughness={0.06}
          metalness={0}
          ior={1.45}
          reflectivity={0.4}
          side={DoubleSide}
        />
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

      {/* Base. */}
      <mesh position={[0, BASE_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[OUTER_RADIUS, OUTER_RADIUS, BASE_HEIGHT, 48]} />
        <meshPhysicalMaterial
          color="#cfe4f2"
          transparent
          opacity={0.35}
          roughness={0.08}
          metalness={0}
          ior={1.45}
        />
      </mesh>

      {/* Rim, the thickened lip a real beaker has. */}
      <mesh position={[0, WALL_HEIGHT, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[OUTER_RADIUS, 0.016, 12, 48]} />
        <meshPhysicalMaterial
          color="#dcecf7"
          transparent
          opacity={0.5}
          roughness={0.1}
          metalness={0}
        />
      </mesh>

      <Liquid />
      <Bubbles />
    </group>
  );
}
