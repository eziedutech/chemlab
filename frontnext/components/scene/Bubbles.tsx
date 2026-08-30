"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { InstancedMesh, Object3D } from "three";
import {
  BASE_HEIGHT,
  LIQUID_RADIUS,
  surfaceHeight,
} from "../../lib/scene/beakerGeometry";
import { useLabStore } from "../../store/labStore";

/**
 * Bubble count. The performance note in the brief caps effects at roughly 300
 * particles, and this sits well under it: the target machine is a school
 * laptop, not a workstation.
 */
const COUNT = 110;
const RADIUS = LIQUID_RADIUS - 0.04;

interface Bubble {
  angle: number;
  distance: number;
  height: number;
  speed: number;
  size: number;
  /** Sideways drift, so the column does not look like a set of straight lines. */
  wobble: number;
}

function seedBubbles(): Bubble[] {
  return Array.from({ length: COUNT }, () => ({
    angle: Math.random() * Math.PI * 2,
    distance: Math.sqrt(Math.random()) * RADIUS,
    height: Math.random(),
    speed: 0.12 + Math.random() * 0.22,
    size: 0.4 + Math.random() * 0.75,
    wobble: Math.random() * Math.PI * 2,
  }));
}

/**
 * Carbon dioxide rising through the liquid.
 *
 * One instanced mesh rather than a hundred objects, and the whole thing is
 * driven by matrix writes inside the frame loop, so a fizzing beaker costs no
 * React renders at all. Bubbles fade in and out with the reaction instead of
 * appearing and vanishing on a single frame.
 */
export function Bubbles() {
  const meshRef = useRef<InstancedMesh>(null);
  const bubbles = useMemo(seedBubbles, []);
  const dummy = useMemo(() => new Object3D(), []);
  /** How much of the effect is showing, so it can ease in and out. */
  const strength = useRef(0);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const beaker = useLabStore.getState().beaker;
    const target = beaker.bubbles && beaker.volumeMl > 1 ? 1 : 0;
    if (Math.abs(target - strength.current) < 0.002) {
      strength.current = target;
    } else {
      strength.current += (target - strength.current) * Math.min(1, delta * 2.2);
    }

    if (strength.current < 0.01) {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;

    const top = surfaceHeight(beaker.volumeMl);
    const span = Math.max(0.02, top - BASE_HEIGHT);
    const now = performance.now() / 1000;

    for (let index = 0; index < COUNT; index += 1) {
      const bubble = bubbles[index];

      // Rise, and start again from the bottom on reaching the surface.
      bubble.height += (bubble.speed * delta) / span;
      if (bubble.height > 1) bubble.height -= 1;

      const drift = Math.sin(now * 1.6 + bubble.wobble) * 0.012;
      dummy.position.set(
        Math.cos(bubble.angle) * bubble.distance + drift,
        BASE_HEIGHT + bubble.height * span,
        Math.sin(bubble.angle) * bubble.distance + drift,
      );

      // Bubbles grow slightly as they rise, and thin out near the surface.
      const nearTop = Math.min(1, (1 - bubble.height) * 6);
      const scale = bubble.size * strength.current * (0.6 + bubble.height * 0.5) * nearTop;
      dummy.scale.setScalar(Math.max(0.0001, scale));
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, COUNT]}
      visible={false}
      /* The bounding sphere is the one bubble at the origin, so leaving culling
         on would drop the whole column. */
      frustumCulled={false}
    >
      <sphereGeometry args={[0.019, 8, 6]} />
      <meshStandardMaterial
        color="#f4fbff"
        transparent
        opacity={0.7}
        roughness={0.1}
        metalness={0}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
