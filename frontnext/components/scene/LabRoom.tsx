"use client";

import { useEffect, useMemo, useRef } from "react";
import { InstancedMesh, Object3D } from "three";
import {
  createBeakerGeometry,
  createCylinderGeometry,
} from "../../lib/scene/glassProfiles";
import { createTileTexture } from "../../lib/scene/tileTexture";

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
/** The island bench in the middle, where the experiment stands. */
const ISLAND_WIDTH = 0.82;
const ISLAND_DEPTH = 1.45;

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
          scale: 0.9 + Math.random() * 0.35,
          rotation: Math.random() * Math.PI,
        });
      }
    }
  }

  return placements;
}

/**
 * The cupboards and drawers along the front of both side counters.
 *
 * Without them a counter is a long grey slab, which is what a placeholder
 * looks like. A teaching bench is a run of identical units, each a drawer over
 * a pair of doors, and repeating that is enough to say "storage" from across
 * the room.
 *
 * Drawn as four instanced meshes for the whole room rather than as loose boxes.
 * The loose version came to a hundred and forty four meshes, and a hundred and
 * forty four draw calls for a background detail is the sort of thing that
 * quietly takes the frame rate away from the experiment.
 */
function CabinetRuns() {
  const drawers = useRef<InstancedMesh>(null);
  const doors = useRef<InstancedMesh>(null);
  const drawerPulls = useRef<InstancedMesh>(null);
  const doorPulls = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  const runLength = ROOM_DEPTH - 1.8;
  const unitWidth = 1.1;
  const units = Math.floor(runLength / unitWidth);

  const carcass = COUNTER_HEIGHT - 0.1;
  const drawerHeight = 0.2;
  const doorHeight = carcass - drawerHeight - 0.09;
  const drawerY = carcass - drawerHeight / 2 - 0.03;
  const doorY = 0.05 + doorHeight / 2;

  const layout = useMemo(() => {
    const startZ = -(units * unitWidth) / 2 + unitWidth / 2;
    const drawerAt: [number, number, number][] = [];
    const doorAt: [number, number, number][] = [];
    const drawerPullAt: [number, number, number][] = [];
    const doorPullAt: [number, number, number][] = [];

    for (const side of [-1, 1] as const) {
      const x = side * (COUNTER_X + 0.2) + side * 0.12;
      // The face onto the aisle is the one towards the middle of the room.
      const faceX = x - side * ((COUNTER_DEPTH * 1.25) / 2);
      const panelX = faceX - side * 0.012;
      const pullX = faceX - side * 0.032;

      for (let index = 0; index < units; index += 1) {
        const z = startZ + index * unitWidth;
        drawerAt.push([panelX, drawerY, z]);
        drawerPullAt.push([pullX, drawerY, z]);
        for (const half of [-1, 1]) {
          doorAt.push([panelX, doorY, z + (half * (unitWidth - 0.06)) / 4]);
          doorPullAt.push([pullX, doorY + doorHeight / 2 - 0.09, z + half * 0.045]);
        }
      }
    }

    return { drawerAt, doorAt, drawerPullAt, doorPullAt };
  }, [units, drawerY, doorY, doorHeight]);

  useMemo(() => {
    const apply = (mesh: InstancedMesh | null, at: [number, number, number][], rotate: boolean) => {
      if (!mesh) return;
      at.forEach((position, index) => {
        dummy.position.set(...position);
        dummy.rotation.set(rotate ? Math.PI / 2 : 0, 0, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    };

    queueMicrotask(() => {
      apply(drawers.current, layout.drawerAt, false);
      apply(doors.current, layout.doorAt, false);
      apply(drawerPulls.current, layout.drawerPullAt, true);
      apply(doorPulls.current, layout.doorPullAt, false);
    });
  }, [layout, dummy]);

  const front = (
    <meshStandardMaterial color="#6d7784" roughness={0.72} metalness={0.1} />
  );
  const metal = (
    <meshStandardMaterial color="#aeb8c4" roughness={0.35} metalness={0.75} />
  );

  return (
    <group>
      <instancedMesh
        ref={drawers}
        args={[undefined, undefined, layout.drawerAt.length]}
        frustumCulled={false}
      >
        <boxGeometry args={[0.024, drawerHeight, unitWidth - 0.06]} />
        {front}
      </instancedMesh>

      <instancedMesh
        ref={doors}
        args={[undefined, undefined, layout.doorAt.length]}
        frustumCulled={false}
      >
        <boxGeometry args={[0.024, doorHeight, unitWidth / 2 - 0.05]} />
        {front}
      </instancedMesh>

      <instancedMesh
        ref={drawerPulls}
        args={[undefined, undefined, layout.drawerPullAt.length]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.011, 0.011, unitWidth * 0.42, 8]} />
        {metal}
      </instancedMesh>

      <instancedMesh
        ref={doorPulls}
        args={[undefined, undefined, layout.doorPullAt.length]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.009, 0.009, 0.11, 8]} />
        {metal}
      </instancedMesh>

      {/* A plinth per side, set back, so a run does not sit flat on the floor. */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (COUNTER_X + 0.32), 0.025, 0]}>
          <boxGeometry args={[COUNTER_DEPTH * 1.1, 0.05, runLength]} />
          <meshStandardMaterial color="#4a535f" roughness={0.85} metalness={0.05} />
        </mesh>
      ))}
    </group>
  );
}

function Shelving({ side }: { side: -1 | 1 }) {
  const x = side * (COUNTER_X + 0.2);

  return (
    <group>
      {/* Counter top and the cabinets under it. */}
      <mesh position={[x, COUNTER_HEIGHT, 0]}>
        <boxGeometry args={[COUNTER_DEPTH * 1.6, 0.07, ROOM_DEPTH - 1.6]} />
        <meshStandardMaterial
          color="#3b4757"
          roughness={0.55}
          metalness={0.1}
          envMapIntensity={0.85}
        />
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

  // The same shapes as the bench, at room scale. They are metres away and
  // never touched, so they get a plain material and no transmission.
  const jarGeometry = useMemo(() => createBeakerGeometry(0.05, 0.11), []);
  const cylinderGeometry = useMemo(() => createCylinderGeometry(0.026, 0.19), []);

  useEffect(
    () => () => {
      jarGeometry.dispose();
      cylinderGeometry.dispose();
    },
    [jarGeometry, cylinderGeometry],
  );

  // Heights are the surfaces themselves. The imported meshes carry their origin
  // at the base, so anything else leaves them hovering above the shelf.
  const lowerShelf = 1.72 + 0.018;
  const upperShelf = 2.24 + 0.018;
  const counterTop = COUNTER_HEIGHT + 0.035;

  const bottlePlacements = useMemo(
    () => shelfPlacements(BOTTLE_COUNT, [lowerShelf, upperShelf, counterTop], 0.24),
    [lowerShelf, upperShelf, counterTop],
  );
  const flaskPlacements = useMemo(
    () => shelfPlacements(FLASK_COUNT, [lowerShelf, counterTop], 0.3),
    [lowerShelf, counterTop],
  );

  useMemo(() => {
    const apply = (
      mesh: InstancedMesh | null,
      placements: Placement[],
      scale: number,
    ) => {
      if (!mesh) return;
      placements.forEach((placement, index) => {
        dummy.position.set(...placement.position);
        dummy.scale.setScalar(placement.scale * scale);
        dummy.rotation.set(0, placement.rotation, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    };

    // Refs are populated by the time this runs on the client render pass.
    queueMicrotask(() => {
      apply(bottles.current, bottlePlacements, 1);
      apply(flasks.current, flaskPlacements, 1);
    });
  }, [bottlePlacements, flaskPlacements, dummy]);

  const shelfMaterial = (
    <meshPhysicalMaterial
      color="#eaf4fd"
      transparent
      opacity={0.5}
      roughness={0.06}
      metalness={0}
      ior={1.5}
      reflectivity={0.6}
      envMapIntensity={2.2}
    />
  );

  return (
    <group>
      <instancedMesh
        ref={bottles}
        args={[jarGeometry, undefined, BOTTLE_COUNT]}
        frustumCulled={false}
      >
        {shelfMaterial}
      </instancedMesh>

      <instancedMesh
        ref={flasks}
        args={[cylinderGeometry, undefined, FLASK_COUNT]}
        frustumCulled={false}
      >
        {shelfMaterial}
      </instancedMesh>
    </group>
  );
}

/** Side of one floor tile, in metres. */
const TILE_SIZE = 0.6;

export function LabRoom() {
  const tiles = useMemo(() => {
    const texture = createTileTexture();
    if (texture) {
      texture.repeat.set(ROOM_WIDTH / TILE_SIZE, ROOM_DEPTH / TILE_SIZE);
    }
    return texture;
  }, []);

  useEffect(() => () => tiles?.dispose(), [tiles]);

  return (
    <group>
      {/* Floor, tiled so it reads as a floor rather than as more benchtop. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial
          map={tiles ?? undefined}
          color={tiles ? "#ffffff" : "#6b737d"}
          roughness={0.72}
          metalness={0.05}
        />
      </mesh>

      {/* Walls. The camera sits inside, so only three are ever seen. */}
      <mesh position={[0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
        <meshStandardMaterial color="#dde4ec" roughness={0.9} />
      </mesh>
      <mesh
        position={[-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
        <meshStandardMaterial color="#d6dde6" roughness={0.9} />
      </mesh>
      <mesh
        position={[ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
        <meshStandardMaterial color="#d6dde6" roughness={0.9} />
      </mesh>

      {/* Ceiling, with recessed strip lights running down its length. */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_HEIGHT, 0]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial color="#e4e9f0" roughness={0.95} />
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
      <CabinetRuns />
      <Glassware />

      {/* Task light over the island bench.
          Glass is legible because of what it reflects and what shines through
          it, so a bright source directly above the apparatus does more for it
          than any material setting: it draws the highlight along the rim and
          lights the liquid from above. Lab benches carry one for the same
          practical reason. */}
      <group position={[0, 1.95, 0]}>
        <mesh>
          <boxGeometry args={[0.72, 0.05, 0.26]} />
          <meshStandardMaterial color="#b9c3ce" roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh position={[0, -0.028, 0]}>
          <boxGeometry args={[0.66, 0.012, 0.2]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#f2f8ff"
            emissiveIntensity={2.4}
            roughness={0.3}
          />
        </mesh>
        {/* Two thin suspension rods up to the ceiling. */}
        {[-0.26, 0.26].map((x) => (
          <mesh key={x} position={[x, (ROOM_HEIGHT - 1.95) / 2, 0]}>
            <cylinderGeometry args={[0.006, 0.006, ROOM_HEIGHT - 1.95, 6]} />
            <meshStandardMaterial color="#8e99a8" roughness={0.5} metalness={0.6} />
          </mesh>
        ))}
        {/* Three weak lights along the fitting rather than one strong one.
            A single point source lands on the bench as a hot spot; spreading
            it out is what a diffuser does. */}
        {[-0.22, 0, 0.22].map((x) => (
          <pointLight
            key={x}
            position={[x, -0.12, 0]}
            intensity={0.42}
            color="#f4faff"
          />
        ))}
      </group>

      {/* The island bench the experiment stands on. Its top is the plane
          everything else in the scene is measured from.

          Narrower than it was. At the old size it read as a loading dock: the
          glassware sat in the middle of an expanse of dark top with the wall
          run pushed off to one side, and the room looked lopsided. Bringing
          the edges in leaves an aisle on both sides and lets the two wall runs
          balance each other. */}
      <mesh position={[0, COUNTER_HEIGHT - 0.035, 0]}>
        <boxGeometry args={[ISLAND_WIDTH, 0.07, ISLAND_DEPTH]} />
        <meshStandardMaterial color="#171d25" roughness={0.7} metalness={0.06} />
      </mesh>
      {/* The working surface itself, and it is not a mirror.

          It was one, softly, and the reflection kept putting a second upside
          down copy of the glassware under the real thing. A school bench is
          sealed epoxy resin: dark, matte, and it shows you nothing. Take the
          reflection away and the glass has a plain dark ground to sit against,
          which is what makes a clear vessel legible in the first place. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, COUNTER_HEIGHT + 0.0008, 0]}>
        <planeGeometry args={[ISLAND_WIDTH, ISLAND_DEPTH]} />
        <meshStandardMaterial
          color="#1b222b"
          roughness={0.94}
          metalness={0}
          envMapIntensity={0.25}
        />
      </mesh>

      <mesh position={[0, (COUNTER_HEIGHT - 0.07) / 2, 0]}>
        <boxGeometry args={[ISLAND_WIDTH - 0.18, COUNTER_HEIGHT - 0.07, ISLAND_DEPTH - 0.2]} />
        <meshStandardMaterial color="#7e8896" roughness={0.75} metalness={0.08} />
      </mesh>
    </group>
  );
}
