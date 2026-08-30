"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, Group, Mesh, MeshStandardMaterial } from "three";
import { surfaceHeight } from "../../lib/scene/beakerGeometry";
import { GLASSWARE_NODES, useGlasswarePiece } from "../../lib/scene/glassware";
import { createScaleTexture } from "../../lib/scene/scaleTexture";
import {
  CYLINDER_BASE,
  CYLINDER_HEIGHT,
  CYLINDER_MAX_ML,
  CYLINDER_RADIUS,
  cylinderSurfaceHeight,
  vesselSlot,
} from "../../lib/scene/vesselGeometry";
import {
  MEASURE_DURATION_MS,
  MEASURE_STAGGER_MS,
  POUR_DURATION_MS,
  useLabStore,
  type PourJob,
} from "../../store/labStore";

/** Timeline of adding one vessel to the beaker, as fractions of the total. */
const PHASE = {
  liftEnd: 0.16,
  carryEnd: 0.32,
  tipEnd: 0.44,
  pourEnd: 0.72,
  uprightEnd: 0.84,
};

/** Where the mouth of the vessel is held while it empties into the beaker. */
const POUR_POSITION: [number, number, number] = [0.17, 1.24, 0];
const CARRY_HEIGHT = 1.48;
const TIP_ANGLE = -2.05;
const SCOOP_TIP_ANGLE = -1.5;

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function progressWithin(value: number, start: number, end: number): number {
  return Math.min(1, Math.max(0, (value - start) / (end - start)));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

interface VesselProps {
  job: PourJob;
  index: number;
  total: number;
}

/**
 * One measured out reagent, from the bench to the beaker.
 *
 * A liquid goes into a graduated cylinder, filled to the measure the agent
 * asked for, so the amount is something you can read rather than take on
 * trust. A powder sits on a spatula, because that is how a powder is actually
 * handled: nobody measures baking soda in a measuring cylinder. When its turn
 * comes the vessel is lifted, tipped over the beaker, and emptied, and its own
 * contents drain away as the beaker fills.
 */
export function Vessel({ job, index, total }: VesselProps) {
  const isActive = useLabStore((state) => state.pourQueue[0]?.id === job.id);
  const applyPour = useLabStore((state) => state.applyPour);
  const completePour = useLabStore((state) => state.completePour);

  const carrier = useRef<Group>(null);
  const tilter = useRef<Group>(null);
  const liquidRef = useRef<Mesh>(null);
  const surfaceRef = useRef<Mesh>(null);
  const heapRef = useRef<Mesh>(null);
  const streamRef = useRef<Mesh>(null);
  const streamMaterial = useRef<MeshStandardMaterial>(null);

  const elapsed = useRef(0);
  const applied = useRef(false);
  const started = useRef(false);
  /** How full the vessel is, 1 while it holds its full measure. */
  const fill = useRef(0);

  const isScoop = job.kind === "scoop";
  const piece = useGlasswarePiece(GLASSWARE_NODES.cylinder);
  const slot = useMemo(() => vesselSlot(index, total), [index, total]);
  /** Mouth height when the vessel stands on the bench. */
  const restHeight = isScoop ? 0.16 : CYLINDER_HEIGHT;

  const scale = useMemo(
    () =>
      createScaleTexture({
        wallHeight: CYLINDER_HEIGHT,
        radius: CYLINDER_RADIUS,
        maxMl: CYLINDER_MAX_ML,
        minorEveryMl: 10,
        majorEveryMl: 50,
        surfaceHeight: cylinderSurfaceHeight,
        fontPx: 22,
      }),
    [],
  );
  useEffect(() => () => scale?.dispose(), [scale]);

  useEffect(() => {
    if (isActive && !started.current) {
      started.current = true;
      elapsed.current = 0;
      applied.current = false;
    }
  }, [isActive]);

  useFrame((_, delta) => {
    const group = carrier.current;
    const tilt = tilter.current;
    if (!group || !tilt) return;

    const state = useLabStore.getState();
    const mix = state.mix;

    // --- measuring: the vessel fills where it stands --------------------
    if (mix && mix.stage === "measuring") {
      const sinceStart = Date.now() - mix.startedAt - index * MEASURE_STAGGER_MS;
      const measured = Math.min(1, Math.max(0, sinceStart / MEASURE_DURATION_MS));
      fill.current = easeInOut(measured);
      group.position.set(slot[0], restHeight, slot[2]);
      tilt.rotation.z = 0;
      if (streamRef.current) streamRef.current.visible = false;
    }

    // --- adding: whoever is at the head of the queue goes to the beaker --
    if (isActive) {
      elapsed.current += delta * 1000;
      const t = Math.min(1, elapsed.current / POUR_DURATION_MS);

      let x = slot[0];
      let y = restHeight;
      let z = slot[2];

      if (t < PHASE.liftEnd) {
        const p = easeInOut(progressWithin(t, 0, PHASE.liftEnd));
        y = lerp(restHeight, CARRY_HEIGHT, p);
      } else if (t < PHASE.carryEnd) {
        const p = easeInOut(progressWithin(t, PHASE.liftEnd, PHASE.carryEnd));
        x = lerp(slot[0], POUR_POSITION[0], p);
        z = lerp(slot[2], POUR_POSITION[2], p);
        y = lerp(CARRY_HEIGHT, POUR_POSITION[1], p);
      } else if (t < PHASE.uprightEnd) {
        [x, y, z] = POUR_POSITION;
      } else {
        const p = easeInOut(progressWithin(t, PHASE.uprightEnd, 1));
        x = lerp(POUR_POSITION[0], slot[0], p);
        z = lerp(POUR_POSITION[2], slot[2], p);
        y = lerp(POUR_POSITION[1], restHeight, p);
      }
      group.position.set(x, y, z);

      // The vessel turns about its own mouth, the way a hand tips it.
      const fullAngle = isScoop ? SCOOP_TIP_ANGLE : TIP_ANGLE;
      let angle = 0;
      if (t >= PHASE.carryEnd && t < PHASE.tipEnd) {
        angle = fullAngle * easeInOut(progressWithin(t, PHASE.carryEnd, PHASE.tipEnd));
      } else if (t >= PHASE.tipEnd && t < PHASE.pourEnd) {
        angle = fullAngle;
      } else if (t >= PHASE.pourEnd && t < PHASE.uprightEnd) {
        angle =
          fullAngle * (1 - easeInOut(progressWithin(t, PHASE.pourEnd, PHASE.uprightEnd)));
      }
      tilt.rotation.z = angle;

      // What it holds drains out over the pouring phase.
      if (t >= PHASE.tipEnd) {
        fill.current = 1 - progressWithin(t, PHASE.tipEnd, PHASE.pourEnd);
      }

      const stream = streamRef.current;
      if (stream) {
        const pouring = !isScoop && t >= PHASE.tipEnd && t < PHASE.pourEnd;
        stream.visible = pouring;
        if (pouring) {
          const level = surfaceHeight(state.beaker.volumeMl);
          const length = Math.max(0.05, POUR_POSITION[1] - level);
          stream.scale.set(1, length, 1);
          stream.position.set(0, -length / 2, 0);
          if (streamMaterial.current) {
            const p = progressWithin(t, PHASE.tipEnd, PHASE.pourEnd);
            streamMaterial.current.color.set(job.color);
            streamMaterial.current.opacity = 0.8 * Math.min(1, Math.min(p, 1 - p) * 8);
          }
        }
      }

      // The beaker changes when the vessel is actually tipped over it.
      if (!applied.current && t >= PHASE.tipEnd) {
        applied.current = true;
        applyPour(job.id);
      }

      if (t >= 1) completePour(job.id);
    } else if (mix && mix.stage !== "measuring") {
      // Waiting its turn, or already emptied: stand still on the bench.
      group.position.set(slot[0], restHeight, slot[2]);
      tilt.rotation.z = 0;
      if (streamRef.current) streamRef.current.visible = false;
    }

    // --- what the vessel holds -------------------------------------------
    const held = fill.current * job.measuredMl;
    const liquid = liquidRef.current;
    const surface = surfaceRef.current;
    if (liquid && surface) {
      const height = cylinderSurfaceHeight(held) - CYLINDER_BASE;
      const visible = height > 0.002;
      liquid.visible = visible;
      surface.visible = visible;
      if (visible) {
        liquid.scale.y = height;
        liquid.position.y = CYLINDER_BASE + height / 2;
        surface.position.y = CYLINDER_BASE + height + 0.001;
      }
    }
    if (heapRef.current) {
      const amount = Math.max(0.001, fill.current);
      heapRef.current.scale.set(amount, amount, amount);
      heapRef.current.visible = fill.current > 0.02;
    }
  });

  return (
    <group ref={carrier} position={[slot[0], restHeight, slot[2]]}>
      {/* Turning this group turns the vessel about its mouth, which sits at
          the group origin. The body hangs below it. */}
      <group ref={tilter}>
        <group position={[0, -restHeight, 0]}>
          {isScoop ? (
            <group>
              {/* Spatula: a handle and a shallow scoop holding the powder. */}
              <mesh position={[0.2, 0.06, 0]} rotation={[0, 0, 0.08]}>
                <boxGeometry args={[0.32, 0.018, 0.032]} />
                <meshStandardMaterial color="#93a2b5" roughness={0.35} metalness={0.7} />
              </mesh>
              <mesh position={[-0.02, 0.055, 0]} rotation={[Math.PI, 0, 0]} scale={[1, 0.62, 1]}>
                <sphereGeometry args={[0.1, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial
                  color="#a9b6c6"
                  roughness={0.3}
                  metalness={0.75}
                  side={DoubleSide}
                />
              </mesh>
              <mesh ref={heapRef} position={[-0.02, 0.062, 0]}>
                <sphereGeometry args={[0.078, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color={job.color} roughness={0.9} metalness={0} />
              </mesh>
            </group>
          ) : (
            <group>
              {/* The imported cylinder, which brings its own foot and lip.
                  The primitive below stands in if the model has not loaded. */}
              {piece ? (
                <mesh
                  geometry={piece.mesh.geometry}
                  scale={CYLINDER_HEIGHT / piece.height}
                >
                  <meshPhysicalMaterial
                    color="#dceaf5"
                    transparent
                    opacity={0.26}
                    roughness={0.04}
                    metalness={0}
                    ior={1.5}
                    reflectivity={0.55}
                    envMapIntensity={1.6}
                    side={DoubleSide}
                  />
                </mesh>
              ) : (
                <>
                  <mesh position={[0, 0.012, 0]}>
                    <cylinderGeometry
                      args={[CYLINDER_RADIUS * 1.55, CYLINDER_RADIUS * 1.7, 0.024, 28]}
                    />
                    <meshPhysicalMaterial
                      color="#cfe4f2"
                      transparent
                      opacity={0.4}
                      roughness={0.1}
                      ior={1.45}
                    />
                  </mesh>
                  <mesh position={[0, CYLINDER_HEIGHT / 2, 0]}>
                    <cylinderGeometry
                      args={[CYLINDER_RADIUS, CYLINDER_RADIUS, CYLINDER_HEIGHT, 32, 1, true]}
                    />
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
                </>
              )}

              {/* Printed volume scale. */}
              {scale && (
                <mesh position={[0, CYLINDER_HEIGHT / 2, 0]} rotation={[0, -0.3, 0]}>
                  <cylinderGeometry
                    args={[
                      CYLINDER_RADIUS + 0.003,
                      CYLINDER_RADIUS + 0.003,
                      CYLINDER_HEIGHT,
                      32,
                      1,
                      true,
                    ]}
                  />
                  <meshBasicMaterial map={scale} transparent depthWrite={false} side={DoubleSide} />
                </mesh>
              )}

              {!piece && (
                <>
                  <mesh position={[0, CYLINDER_BASE / 2 + 0.024, 0]}>
                    <cylinderGeometry
                      args={[CYLINDER_RADIUS, CYLINDER_RADIUS, CYLINDER_BASE, 32]}
                    />
                    <meshPhysicalMaterial
                      color="#cfe4f2"
                      transparent
                      opacity={0.35}
                      roughness={0.08}
                    />
                  </mesh>
                  <mesh position={[0, CYLINDER_HEIGHT, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[CYLINDER_RADIUS, 0.011, 10, 32]} />
                    <meshPhysicalMaterial
                      color="#dcecf7"
                      transparent
                      opacity={0.5}
                      roughness={0.1}
                    />
                  </mesh>
                </>
              )}

              {/* The measured liquid. */}
              <mesh ref={liquidRef} visible={false}>
                <cylinderGeometry
                  args={[CYLINDER_RADIUS - 0.012, CYLINDER_RADIUS - 0.012, 1, 32]}
                />
                <meshStandardMaterial
                  color={job.color}
                  transparent
                  opacity={0.88}
                  roughness={0.25}
                />
              </mesh>
              <mesh ref={surfaceRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
                <circleGeometry args={[CYLINDER_RADIUS - 0.012, 32]} />
                <meshStandardMaterial
                  color={job.color}
                  transparent
                  opacity={0.95}
                  roughness={0.12}
                />
              </mesh>
            </group>
          )}
        </group>
      </group>

      {/* Falling stream, drawn from the mouth downwards. */}
      {!isScoop && (
        <mesh ref={streamRef} visible={false}>
          <cylinderGeometry args={[0.028, 0.04, 1, 14, 1, true]} />
          <meshStandardMaterial
            ref={streamMaterial}
            color={job.color}
            transparent
            opacity={0.8}
            roughness={0.2}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
