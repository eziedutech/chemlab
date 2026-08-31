"use client";

import { useEffect, useMemo, useState } from "react";
import { MeshTransmissionMaterial } from "@react-three/drei";
import { CanvasTexture, DoubleSide } from "three";
import {
  BASE_HEIGHT,
  FULL_VOLUME_ML,
  OUTER_RADIUS,
  surfaceHeight,
  WALL_HEIGHT,
} from "../../lib/scene/beakerGeometry";
import { GLASSWARE_NODES, useGlasswarePiece } from "../../lib/scene/glassware";
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
/**
 * Whether this device gets refracting glass.
 *
 * Transmission renders the scene into a buffer every frame, which is the one
 * effect a phone really feels, so it is reserved for a screen wide enough to
 * suggest a laptop. Everything else gets the cheaper transparent glass, which
 * is the same shape, just flatter.
 */
function useRefractingGlass(): boolean {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setAllowed(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return allowed;
}

export function Beaker() {
  const graduations = useGraduationTexture();
  const piece = useGlasswarePiece(GLASSWARE_NODES.beaker);
  const refracting = useRefractingGlass();

  return (
    <group>
      {/* The glass itself. The imported mesh has the lip, the spout and the
          thick base that a cylinder cannot suggest, so it is used whenever it
          loads, and the primitive stands in when it does not. */}
      {piece ? (
        <mesh geometry={piece.mesh.geometry} scale={WALL_HEIGHT / piece.height}>
          {refracting ? (
            /* Real refraction: what makes glass read as glass rather than as a
               transparent shell. Kept to a small buffer and two samples, since
               it costs an extra pass every frame. */
            <MeshTransmissionMaterial
              samples={2}
              resolution={256}
              transmission={1}
              thickness={0.22}
              roughness={0.08}
              ior={1.5}
              chromaticAberration={0.035}
              anisotropy={0.1}
              distortion={0.05}
              distortionScale={0.2}
              temporalDistortion={0}
              color="#eef6ff"
              attenuationColor="#dbeaf6"
              attenuationDistance={2.4}
              side={DoubleSide}
            />
          ) : (
            <meshPhysicalMaterial
              color="#dceaf5"
              transparent
              opacity={0.28}
              roughness={0.04}
              metalness={0}
              ior={1.5}
              reflectivity={0.55}
              envMapIntensity={1.6}
              side={DoubleSide}
            />
          )}
        </mesh>
      ) : (
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
      )}

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

      {!piece && (
        <>
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
        </>
      )}

      <Liquid />
      <Bubbles />
    </group>
  );
}
