"use client";

import { useMemo, useRef } from "react";
import { InstancedMesh, Object3D } from "three";

/**
 * The room the experiment stands in.
 *
 * Built from primitives rather than a photograph: nothing here is licensed
 * from anyone, it lights consistently with the rest of the scene, and it stays
 * sharp at any screen size. The layout follows a real teaching lab, benches
 * down both walls with an aisle between them, and the experiment bench in the
 * middle where the camera is already pointed.
 *
 * Everything is deliberately cheap. The glassware on the shelves is two
 * instanced meshes rather than a hundred objects, there are no shadow maps, and
 * the ceiling lights are emissive surfaces with a couple of real lights doing
 * the actual work.
 *
 * Dimensions here are in metres. The experiment is modelled at its own larger
 * scale, so the caller scales this room up until a 250 ml beaker looks like a
 * 250 ml beaker standing on a waist high bench.
 */

const ROOM_WIDTH = 12.5;
const ROOM_DEPTH = 15;
const ROOM_HEIGHT = 3.4;
/** Distance from the middle to the front face of each side counter. */
const COUNTER_X = 3.6;
export const COUNTER_HEIGHT = 0.92;
const COUNTER_DEPTH = 0.85;

/** Bottles and flasks standing on the shelves, as one instanced mesh each. */
const BOTTLE_COUNT = 48;
const FLASK_COUNT = 24;

interface Placement {
  position: [number, number, number];
  scale: number;
  rotation: number;
}

function shelfPlacements(count: number, levels: number[], jitter: number): Placement[] {
  const placements: Placement[] = [];
  const perSide = Math.ceil(count / (levels.length * 2));

  for (const y of levels) {
    for (const side of [-1, 1]) {
      for (let index = 0; index < perSide; index += 1) {
        if (placements.length >= count) break;
        const spread = (index / Math.max(1, perSide - 1)) * (ROOM_DEPTH - 4) - (ROOM_DEPTH - 4) / 2;
        placements.push({
          position: [
            side * (COUNTER_X + 0.18) + (Math.random() - 0.5) * jitter,
            y,
            spread + (Math.random() - 0.5) * 0.22,
          ],
          scale: 0.8 + Math.random() * 0.5,
          rotation: Math.random() * Math.PI,
        });
      }
    }
  }

  return placements;
}

function Shelving({ side }: { side: -1 | 1 }) {
  const x = side * (COUNTER_X + 0.2);

  return (
    <group>
      {/* Counter top and the cabinets under it. */}
      <mesh position={[x, COUNTER_HEIGHT, 0]}>
        <boxGeometry args={[COUNTER_DEPTH * 1.6, 0.07, ROOM_DEPTH - 1.6]} />
        <meshStandardMaterial color="#3b4757" roughness={0.5} metalness={0.18} />
      </mesh>
      <mesh position={[x + side * 0.12, COUNTER_HEIGHT / 2, 0]}>
        <boxGeometry args={[COUNTER_DEPTH * 1.25, COUNTER_HEIGHT - 0.1, ROOM_DEPTH - 1.8]} />
        <meshStandardMaterial color="#7e8896" roughness={0.75} metalness={0.08} />
      </mesh>

      {/* Two glass shelves above the counter, on thin uprights. */}
      {[1.72, 2.24].map((y) => (
        <mesh key={y} position={[x + side * 0.16, y, 0]}>
          <boxGeometry args={[COUNTER_DEPTH * 1.1, 0.035, ROOM_DEPTH - 2.4]} />
          <meshStandardMaterial
            color="#cfe4f2"
            transparent
            opacity={0.32}
            roughness={0.2}
            metalness={0.05}
          />
        </mesh>
      ))}
      {[-1, 1].map((end) => (
        <mesh
          key={end}
          position={[x + side * 0.16, 1.98, end * ((ROOM_DEPTH - 2.4) / 2 - 0.1)]}
        >
          <boxGeometry args={[0.05, 1.1, 0.05]} />
          <meshStandardMaterial color="#8e99a8" roughness={0.4} metalness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Glassware() {
  const bottles = useRef<InstancedMesh>(null);
  const flasks = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  const bottlePlacements = useMemo(
    () => shelfPlacements(BOTTLE_COUNT, [1.79, 2.31, COUNTER_HEIGHT + 0.13], 0.24),
    [],
  );
  const flaskPlacements = useMemo(
    () => shelfPlacements(FLASK_COUNT, [1.81, COUNTER_HEIGHT + 0.15], 0.3),
    [],
  );

  useMemo(() => {
    // Written once on mount: the shelves never move, so there is no reason for
    // this to touch the frame loop.
    const apply = (mesh: InstancedMesh | null, placements: Placement[]) => {
      if (!mesh) return;
      placements.forEach((placement, index) => {
        dummy.position.set(...placement.position);
        dummy.scale.setScalar(placement.scale);
        dummy.rotation.set(0, placement.rotation, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    };

    // Refs are populated by the time this runs on the client render pass.
    queueMicrotask(() => {
      apply(bottles.current, bottlePlacements);
      apply(flasks.current, flaskPlacements);
    });
  }, [bottlePlacements, flaskPlacements, dummy]);

  return (
    <group>
      <instancedMesh
        ref={bottles}
        args={[undefined, undefined, BOTTLE_COUNT]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.055, 0.06, 0.2, 8]} />
        {/* Standard rather than physical: these are set dressing metres away,
            and a physical transparent material on a hundred instances is the
            kind of cost a school laptop notices. */}
        <meshStandardMaterial color="#dbe9f6" roughness={0.25} metalness={0.05} />
      </instancedMesh>

      <instancedMesh
        ref={flasks}
        args={[undefined, undefined, FLASK_COUNT]}
        frustumCulled={false}
      >
        <coneGeometry args={[0.085, 0.2, 10]} />
        <meshStandardMaterial color="#d3e5f4" roughness={0.25} metalness={0.05} />
      </instancedMesh>
    </group>
  );
}

export function LabRoom() {
  return (
    <group>
      {/* Floor. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial color="#6b737d" roughness={0.72} metalness={0.05} />
      </mesh>

      {/* Walls. The camera sits inside, so only three are ever seen. */}
      <mesh position={[0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
        <meshStandardMaterial color="#aeb7c2" roughness={0.9} />
      </mesh>
      <mesh
        position={[-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
        <meshStandardMaterial color="#a7b0bb" roughness={0.9} />
      </mesh>
      <mesh
        position={[ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
        <meshStandardMaterial color="#a7b0bb" roughness={0.9} />
      </mesh>

      {/* Ceiling, with recessed strip lights running down its length. */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_HEIGHT, 0]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial color="#c6cdd6" roughness={0.95} />
      </mesh>
      {[-2.4, 2.6].map((z) => (
        <group key={z}>
          <mesh position={[0, ROOM_HEIGHT - 0.04, z]}>
            <boxGeometry args={[0.42, 0.06, 2.6]} />
            <meshStandardMaterial
              color="#f4f8ff"
              emissive="#eaf3ff"
              emissiveIntensity={1.6}
              roughness={0.4}
            />
          </mesh>
          {/* No distance cutoff: the room is drawn scaled up, and a light's
              range is not scaled with it. */}
          <pointLight
            position={[0, ROOM_HEIGHT - 0.35, z]}
            intensity={0.4}
            color="#eaf3ff"
          />
        </group>
      ))}

      {/* Windows along the left wall, as emissive panes for depth. */}
      {[-4.2, -1.8, 0.6, 3].map((z) => (
        <mesh
          key={z}
          position={[-ROOM_WIDTH / 2 + 0.02, 2.15, z]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <planeGeometry args={[1.9, 1.1]} />
          <meshStandardMaterial
            color="#dbe9f7"
            emissive="#cfe2f5"
            emissiveIntensity={0.85}
            roughness={0.3}
          />
        </mesh>
      ))}

      <Shelving side={-1} />
      <Shelving side={1} />
      <Glassware />

      {/* The island bench the experiment stands on. Its top is the plane
          everything else in the scene is measured from. */}
      <mesh position={[0, COUNTER_HEIGHT - 0.035, 0]}>
        <boxGeometry args={[1.1, 0.07, 1.9]} />
        <meshStandardMaterial color="#3b4757" roughness={0.5} metalness={0.18} />
      </mesh>
      <mesh position={[0, (COUNTER_HEIGHT - 0.07) / 2, 0]}>
        <boxGeometry args={[0.92, COUNTER_HEIGHT - 0.07, 1.7]} />
        <meshStandardMaterial color="#7e8896" roughness={0.75} metalness={0.08} />
      </mesh>
    </group>
  );
}
