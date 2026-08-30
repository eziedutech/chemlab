"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Mesh, MeshStandardMaterial } from "three";
import { surfaceHeight } from "../../lib/scene/beakerGeometry";
import { POUR_DURATION_MS, useLabStore } from "../../store/labStore";

/**
 * Timeline of a single pour, as fractions of the total duration. The reagent is
 * picked up, carried over the beaker, tipped, held while it empties, brought
 * upright again, and set back down.
 */
const PHASE = {
  liftEnd: 0.16,
  carryEnd: 0.32,
  tipEnd: 0.44,
  pourEnd: 0.7,
  uprightEnd: 0.82,
};

/** Where the bottle mouth sits when the bottle is standing on the bench. */
const REST: [number, number, number] = [-1.15, 0.52, 0.34];
/** Where the mouth is held while pouring: just inside the rim, off centre. */
const POUR_POSITION: [number, number, number] = [0.17, 1.22, 0];
const CARRY_HEIGHT = 1.46;
const TIP_ANGLE = -2.05;

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
 * The reagent bottle that carries out whatever pour is at the head of the
 * queue.
 *
 * This exists because a tool call that only recolours a liquid looks like a
 * scheduled animation. Watching a bottle get lifted, tipped, and emptied is
 * what makes the agent's action read as a step in an experiment.
 */
export function PouringReagent() {
  const job = useLabStore((state) => state.pourQueue[0] ?? null);
  const applyPour = useLabStore((state) => state.applyPour);
  const completePour = useLabStore((state) => state.completePour);

  const carrier = useRef<Group>(null);
  const tilter = useRef<Group>(null);
  const streamRef = useRef<Mesh>(null);
  const bottleMaterial = useRef<MeshStandardMaterial>(null);
  const streamMaterial = useRef<MeshStandardMaterial>(null);

  const elapsed = useRef(0);
  const applied = useRef(false);
  const currentJobId = useRef<number | null>(null);

  useEffect(() => {
    if (job?.id !== currentJobId.current) {
      currentJobId.current = job?.id ?? null;
      elapsed.current = 0;
      applied.current = false;
    }
  }, [job?.id]);

  useFrame((_, delta) => {
    const group = carrier.current;
    const tilt = tilter.current;
    const stream = streamRef.current;
    if (!group || !tilt || !stream) return;

    if (!job) {
      group.visible = false;
      stream.visible = false;
      return;
    }

    group.visible = true;
    elapsed.current += delta * 1000;
    const t = Math.min(1, elapsed.current / POUR_DURATION_MS);

    if (bottleMaterial.current) bottleMaterial.current.color.set(job.color);
    if (streamMaterial.current) streamMaterial.current.color.set(job.color);

    // Position: up from the bench, across to the beaker, then back again.
    let x = REST[0];
    let y = REST[1];
    let z = REST[2];

    if (t < PHASE.liftEnd) {
      const p = easeInOut(progressWithin(t, 0, PHASE.liftEnd));
      y = lerp(REST[1], CARRY_HEIGHT, p);
    } else if (t < PHASE.carryEnd) {
      const p = easeInOut(progressWithin(t, PHASE.liftEnd, PHASE.carryEnd));
      x = lerp(REST[0], POUR_POSITION[0], p);
      z = lerp(REST[2], POUR_POSITION[2], p);
      y = lerp(CARRY_HEIGHT, POUR_POSITION[1], p);
    } else if (t < PHASE.uprightEnd) {
      [x, y, z] = POUR_POSITION;
    } else {
      const p = easeInOut(progressWithin(t, PHASE.uprightEnd, 1));
      x = lerp(POUR_POSITION[0], REST[0], p);
      z = lerp(POUR_POSITION[2], REST[2], p);
      y = lerp(POUR_POSITION[1], REST[1], p);
    }

    group.position.set(x, y, z);

    // Tilt: the bottle rotates about its own mouth, which is this group's origin.
    let angle = 0;
    if (t >= PHASE.carryEnd && t < PHASE.tipEnd) {
      angle = TIP_ANGLE * easeInOut(progressWithin(t, PHASE.carryEnd, PHASE.tipEnd));
    } else if (t >= PHASE.tipEnd && t < PHASE.pourEnd) {
      angle = TIP_ANGLE;
    } else if (t >= PHASE.pourEnd && t < PHASE.uprightEnd) {
      angle =
        TIP_ANGLE * (1 - easeInOut(progressWithin(t, PHASE.pourEnd, PHASE.uprightEnd)));
    }
    tilt.rotation.z = angle;

    // Stream: visible only while the bottle is actually tipped over the beaker,
    // and long enough to reach the liquid surface as it rises.
    const pouring = t >= PHASE.tipEnd && t < PHASE.pourEnd;
    stream.visible = pouring;
    if (pouring) {
      const level = surfaceHeight(useLabStore.getState().beaker.volumeMl);
      const length = Math.max(0.05, POUR_POSITION[1] - level);
      stream.scale.set(1, length, 1);
      // The mesh hangs below the mouth, so it is offset by half its length.
      stream.position.set(0, -length / 2, 0);
      if (streamMaterial.current) {
        // Fade in and out so the stream does not pop.
        const p = progressWithin(t, PHASE.tipEnd, PHASE.pourEnd);
        streamMaterial.current.opacity = 0.75 * Math.min(1, Math.min(p, 1 - p) * 6);
      }
    }

    // The beaker only changes at the moment the bottle is actually tipped.
    if (!applied.current && t >= PHASE.tipEnd) {
      applied.current = true;
      applyPour(job.id);
    }

    if (t >= 1) {
      completePour(job.id);
    }
  });

  return (
    <>
      <group ref={carrier} visible={false}>
        {/* Rotating about this origin makes the mouth the pivot, the way a
            hand tips a bottle. The body hangs below it. */}
        <group ref={tilter}>
          <group position={[0, -0.44, 0]}>
            {/* Body. */}
            <mesh position={[0, 0.17, 0]}>
              <cylinderGeometry args={[0.13, 0.13, 0.34, 24]} />
              <meshStandardMaterial
                ref={bottleMaterial}
                roughness={0.35}
                metalness={0.05}
                transparent
                opacity={0.92}
              />
            </mesh>
            {/* Shoulder. */}
            <mesh position={[0, 0.38, 0]}>
              <cylinderGeometry args={[0.05, 0.13, 0.09, 24]} />
              <meshStandardMaterial color="#cfe4f2" roughness={0.3} transparent opacity={0.5} />
            </mesh>
            {/* Neck. */}
            <mesh position={[0, 0.45, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.06, 20]} />
              <meshStandardMaterial color="#dcecf7" roughness={0.25} transparent opacity={0.6} />
            </mesh>
          </group>
        </group>

        {/* Falling stream, drawn from the mouth downwards. */}
        <mesh ref={streamRef} visible={false}>
          <cylinderGeometry args={[0.03, 0.042, 1, 14, 1, true]} />
          <meshStandardMaterial
            ref={streamMaterial}
            transparent
            opacity={0.75}
            roughness={0.2}
            depthWrite={false}
          />
        </mesh>
      </group>
    </>
  );
}
