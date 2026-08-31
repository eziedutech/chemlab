"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import {
  BASE_HEIGHT,
  surfaceHeight,
} from "../../lib/scene/beakerGeometry";
import { POUR_DURATION_MS, useLabStore } from "../../store/labStore";

const EGG_RADIUS = 0.11;
/**
 * Where the egg waits before the agent asks for it.
 *
 * It lies on its side there. An egg standing on end on a bench is a trick, not
 * a still life, so the height is its short radius rather than its long one.
 */
const REST: [number, number, number] = [0.98, EGG_RADIUS, 0.36];
/** Lying down on the bench, and upright once it is in the liquid. */
const LYING = Math.PI / 2;
const CARRY_HEIGHT = 1.4;

const PHASE = {
  liftEnd: 0.2,
  carryEnd: 0.42,
  releaseEnd: 0.62,
  settleEnd: 0.85,
};

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function progressWithin(value: number, start: number, end: number): number {
  return Math.min(1, Math.max(0, (value - start) / (end - start)));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * The egg used in the density experiment.
 *
 * It is not poured, so it does not come out of a reagent bottle. It works
 * through the same queue as the pours, which keeps the order right: the liquid
 * goes in first, then the egg is lowered into it, and only then does it float
 * or sink according to what the reaction table says.
 */
export function FallingObject() {
  const job = useLabStore((state) => state.pourQueue[0] ?? null);
  const applyPour = useLabStore((state) => state.applyPour);
  const completePour = useLabStore((state) => state.completePour);

  const holder = useRef<Group>(null);
  const elapsed = useRef(0);
  const applied = useRef(false);
  const currentJobId = useRef<number | null>(null);
  /** Height the egg was at when the current drop started. */
  const restingHeight = useRef(REST[1]);

  const isDrop = job?.kind === "drop";

  useEffect(() => {
    if (isDrop && job && job.id !== currentJobId.current) {
      currentJobId.current = job.id;
      elapsed.current = 0;
      applied.current = false;
    }
  }, [isDrop, job]);

  useFrame((_, delta) => {
    const group = holder.current;
    if (!group) return;

    const state = useLabStore.getState();

    // Where the egg belongs once it is in the liquid: resting on the bottom, or
    // riding just under the surface.
    const level = surfaceHeight(state.beaker.volumeMl);
    const sunkHeight = BASE_HEIGHT + EGG_RADIUS * 1.25;
    const floatHeight = Math.max(sunkHeight, level - EGG_RADIUS * 0.55);
    const settledHeight =
      state.objectState === "floats"
        ? floatHeight
        : state.objectState === "sinks"
          ? sunkHeight
          : REST[1];
    // On the bench it lies down; in the beaker it stands, which is the shape
    // the float and sink heights were measured against.
    const restAngle = state.objectState ? 0 : LYING;

    if (!isDrop || !job) {
      // Not being handled right now: sit wherever the state says.
      const target = state.objectState ? 0 : REST[0];
      group.position.x += (target - group.position.x) * Math.min(1, delta * 6);
      group.position.z += ((state.objectState ? 0 : REST[2]) - group.position.z) *
        Math.min(1, delta * 6);
      group.position.y += (settledHeight - group.position.y) * Math.min(1, delta * 6);
      group.rotation.z += (restAngle - group.rotation.z) * Math.min(1, delta * 5);
      restingHeight.current = group.position.y;
      return;
    }

    elapsed.current += delta * 1000;
    const t = Math.min(1, elapsed.current / POUR_DURATION_MS);

    // Picked up and turned the right way up on the way over, so it goes into
    // the liquid standing, which is how it is read there.
    group.rotation.z += (0 - group.rotation.z) * Math.min(1, delta * 4);

    if (t < PHASE.liftEnd) {
      const p = easeInOut(progressWithin(t, 0, PHASE.liftEnd));
      group.position.set(REST[0], lerp(restingHeight.current, CARRY_HEIGHT, p), REST[2]);
    } else if (t < PHASE.carryEnd) {
      const p = easeInOut(progressWithin(t, PHASE.liftEnd, PHASE.carryEnd));
      group.position.set(lerp(REST[0], 0, p), CARRY_HEIGHT, lerp(REST[2], 0, p));
    } else if (t < PHASE.releaseEnd) {
      // Released, so it accelerates rather than easing: this part is a fall.
      const p = progressWithin(t, PHASE.carryEnd, PHASE.releaseEnd);
      group.position.set(0, lerp(CARRY_HEIGHT, level, p * p), 0);
    } else if (t < PHASE.settleEnd) {
      // In the liquid now, where it moves slowly against the drag.
      const p = easeInOut(progressWithin(t, PHASE.releaseEnd, PHASE.settleEnd));
      group.position.set(0, lerp(level, settledHeight, p), 0);
    } else {
      group.position.set(0, settledHeight, 0);
    }

    // A floating egg is never perfectly still.
    if (t >= PHASE.settleEnd && state.objectState === "floats") {
      group.position.y = settledHeight + Math.sin(elapsed.current / 420) * 0.006;
    }

    // The outcome lands when the egg meets the liquid, not when the tool ran.
    if (!applied.current && t >= PHASE.releaseEnd) {
      applied.current = true;
      applyPour(job.id);
    }

    if (t >= 1) {
      restingHeight.current = group.position.y;
      completePour(job.id);
    }
  });

  return (
    <group ref={holder} position={[REST[0], REST[1], REST[2]]} rotation={[0, 0, LYING]}>
      {/* An egg is a squashed sphere, which is all the shape this needs. */}
      <mesh scale={[1, 1.3, 1]}>
        <sphereGeometry args={[EGG_RADIUS, 24, 18]} />
        <meshStandardMaterial color="#f2e3c9" roughness={0.55} metalness={0} />
      </mesh>
    </group>
  );
}
