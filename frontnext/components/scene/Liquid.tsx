"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, Mesh, MeshStandardMaterial } from "three";
import {
  BASE_HEIGHT,
  LIQUID_RADIUS,
  surfaceHeight,
} from "../../lib/scene/beakerGeometry";
import { useLabStore } from "../../store/labStore";

/** Roughly how quickly the level and the colour catch up with the store. */
const EASING_PER_SECOND = 2.6;

/**
 * The liquid in the beaker.
 *
 * The store holds the target level and colour; what is drawn eases towards it
 * every frame, which is what turns a poured reagent into a rising level and a
 * reaction into a colour that bleeds in rather than snapping. The easing runs
 * on refs and mutates the mesh directly, so filling the beaker never triggers a
 * React render.
 */
export function Liquid() {
  const bodyRef = useRef<Mesh>(null);
  const surfaceRef = useRef<Mesh>(null);
  const bodyMaterial = useRef<MeshStandardMaterial>(null);
  const surfaceMaterial = useRef<MeshStandardMaterial>(null);

  const shownVolume = useRef(0);
  const shownColor = useRef(new Color("#dfe8ff"));
  const targetColor = useRef(new Color("#dfe8ff"));
  const lastColorString = useRef("#dfe8ff");

  useFrame((_, delta) => {
    const beaker = useLabStore.getState().beaker;

    if (beaker.color !== lastColorString.current) {
      targetColor.current.set(beaker.color);
      lastColorString.current = beaker.color;
    }

    // Exponential easing, written so the result does not depend on frame rate.
    const step = 1 - Math.exp(-delta * EASING_PER_SECOND);
    shownVolume.current += (beaker.volumeMl - shownVolume.current) * step;
    shownColor.current.lerp(targetColor.current, step);

    const height = surfaceHeight(shownVolume.current) - BASE_HEIGHT;
    const visible = height > 0.002;

    const body = bodyRef.current;
    const surface = surfaceRef.current;
    if (!body || !surface) return;

    body.visible = visible;
    surface.visible = visible;
    if (!visible) return;

    // The geometry is one unit tall, so scaling on y gives the level directly.
    body.scale.y = height;
    body.position.y = BASE_HEIGHT + height / 2;
    surface.position.y = BASE_HEIGHT + height + 0.001;

    bodyMaterial.current?.color.copy(shownColor.current);
    surfaceMaterial.current?.color.copy(shownColor.current);
  });

  return (
    <group>
      <mesh ref={bodyRef} visible={false}>
        <cylinderGeometry args={[LIQUID_RADIUS, LIQUID_RADIUS, 1, 48]} />
        <meshStandardMaterial
          ref={bodyMaterial}
          transparent
          opacity={0.86}
          roughness={0.25}
          metalness={0}
        />
      </mesh>

      {/* Slightly brighter disc at the surface, so the level is legible. */}
      <mesh ref={surfaceRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <circleGeometry args={[LIQUID_RADIUS, 48]} />
        <meshStandardMaterial
          ref={surfaceMaterial}
          transparent
          opacity={0.95}
          roughness={0.12}
          metalness={0}
        />
      </mesh>
    </group>
  );
}
