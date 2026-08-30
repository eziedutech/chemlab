"use client";

import { useMemo } from "react";
import { DoubleSide } from "three";
import { useLabStore } from "../../store/labStore";

const OUTER_RADIUS = 0.5;
const WALL_HEIGHT = 0.92;
const LIQUID_RADIUS = OUTER_RADIUS - 0.025;
/** Volume that fills the beaker to the brim, used to map millilitres to height. */
const FULL_VOLUME_ML = 250;
const MAX_LIQUID_HEIGHT = WALL_HEIGHT * 0.82;

/**
 * A laboratory beaker built from primitives: an open ended wall, a base disc,
 * a rim, and the liquid inside it.
 *
 * The glass is a transparent physical material rather than a transmissive one.
 * Transmission renders the scene a second time per frame, which is exactly the
 * cost a school laptop cannot absorb, and at this scale it buys very little.
 */
export function Beaker() {
  const beaker = useLabStore((state) => state.beaker);

  const liquidHeight = useMemo(() => {
    const ratio = Math.min(1, Math.max(0, beaker.volumeMl / FULL_VOLUME_ML));
    return ratio * MAX_LIQUID_HEIGHT;
  }, [beaker.volumeMl]);

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

      {/* Base. */}
      <mesh position={[0, 0.012, 0]}>
        <cylinderGeometry args={[OUTER_RADIUS, OUTER_RADIUS, 0.024, 48]} />
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

      {/* Liquid, shown only once something has been poured in. */}
      {liquidHeight > 0.001 && (
        <group position={[0, 0.024 + liquidHeight / 2, 0]}>
          <mesh>
            <cylinderGeometry args={[LIQUID_RADIUS, LIQUID_RADIUS, liquidHeight, 48]} />
            <meshStandardMaterial
              color={beaker.color}
              transparent
              opacity={0.86}
              roughness={0.25}
              metalness={0}
            />
          </mesh>
          {/* Slightly brighter disc at the surface, so the meniscus is legible. */}
          <mesh position={[0, liquidHeight / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[LIQUID_RADIUS, 48]} />
            <meshStandardMaterial
              color={beaker.color}
              transparent
              opacity={0.95}
              roughness={0.12}
              metalness={0}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}
