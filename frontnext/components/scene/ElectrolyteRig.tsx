"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, MeshStandardMaterial, PointLight, Quaternion, Vector3 } from "three";
import { OUTER_RADIUS } from "../../lib/scene/beakerGeometry";
import { useLabStore } from "../../store/labStore";

const ELECTRODE_X = 0.22;
const HOLDER_HEIGHT = 1.02;
const ELECTRODE_BOTTOM = 0.13;
/** Where the lamp stands, clear of the beaker and of the reagent bottle. */
const LAMP: [number, number, number] = [1.05, 0, -0.18];

const UP = new Vector3(0, 1, 0);

/**
 * A run of wire through a list of points.
 *
 * It is a path rather than a single straight line because a straight line from
 * an electrode to the lamp goes through the beaker: the wire came out of the
 * middle of the glass, which is not a thing a wire does. Routed over the rim
 * instead, the way it is actually laid on a bench.
 */
function WirePath({ points }: { points: [number, number, number][] }) {
  return (
    <group>
      {points.slice(1).map((point, index) => (
        <Wire key={index} from={points[index]} to={point} />
      ))}
    </group>
  );
}

/** A straight length of wire between two points in the scene. */
function Wire({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  const { position, quaternion, length } = useMemo(() => {
    const start = new Vector3(...from);
    const end = new Vector3(...to);
    const direction = end.clone().sub(start);
    return {
      position: start.clone().add(end).multiplyScalar(0.5),
      quaternion: new Quaternion().setFromUnitVectors(UP, direction.clone().normalize()),
      length: direction.length(),
    };
  }, [from, to]);

  return (
    <mesh position={position} quaternion={quaternion}>
      <cylinderGeometry args={[0.009, 0.009, length, 8]} />
      <meshStandardMaterial color="#22304a" roughness={0.85} metalness={0.1} />
    </mesh>
  );
}

/**
 * The conductivity test rig: two electrodes dipped into the beaker, wired to a
 * lamp. How brightly the lamp burns is the whole result of this experiment, so
 * it eases rather than snapping, the way a filament actually comes up.
 */
export function ElectrolyteRig() {
  const bulbMaterial = useRef<MeshStandardMaterial>(null);
  const glow = useRef<PointLight>(null);
  const shown = useRef(0);

  useFrame((_, delta) => {
    const target = useLabStore.getState().lampBrightness;
    // Snap once it is close, so an idle lamp stops changing at all.
    if (Math.abs(target - shown.current) < 0.002) {
      shown.current = target;
    } else {
      shown.current += (target - shown.current) * Math.min(1, delta * 3.4);
    }

    if (bulbMaterial.current) {
      bulbMaterial.current.emissiveIntensity = shown.current * 2.8;
      bulbMaterial.current.color.setRGB(
        0.5 + shown.current * 0.5,
        0.5 + shown.current * 0.45,
        0.46 + shown.current * 0.25,
      );
    }
    if (glow.current) glow.current.intensity = shown.current * 2.2;
  });

  const electrodeHeight = HOLDER_HEIGHT - ELECTRODE_BOTTOM;

  return (
    <group>
      {/* Cross bar the electrodes hang from. */}
      <mesh position={[0, HOLDER_HEIGHT + 0.03, 0]}>
        <boxGeometry args={[OUTER_RADIUS * 1.5, 0.05, 0.11]} />
        <meshStandardMaterial color="#2b3b55" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Two electrodes, dipping well below the liquid line. Different metals,
          which is how they are told apart in a school kit. */}
      {[-ELECTRODE_X, ELECTRODE_X].map((x) => (
        <mesh key={x} renderOrder={1} position={[x, ELECTRODE_BOTTOM + electrodeHeight / 2, 0]}>
          {/* Square in section rather than a flat strip. A strip 15 thousandths
              deep is honest to the real thing and it also vanishes the moment
              the camera comes round to the side, which is most of the time. */}
          <boxGeometry args={[0.042, electrodeHeight, 0.042]} />
          <meshStandardMaterial
            color={x < 0 ? "#b9c4d4" : "#c9a06a"}
            roughness={0.35}
            metalness={0.75}
            /* The part below the surface has to stay visible.
               The liquid is opaque, because only opaque things reach the
               buffer the glass refracts, and an opaque liquid buries whatever
               stands in it: the electrodes were cut off at the waterline. The
               depth test comes off so they read through it, the same treatment
               the bubbles get. */
            depthTest={false}
          />
        </mesh>
      ))}

      {/* Lamp on its stand. */}
      <group position={LAMP}>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.17, 0.19, 0.04, 24]} />
          <meshStandardMaterial color="#22304a" roughness={0.7} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.28, 0]}>
          <cylinderGeometry args={[0.024, 0.024, 0.52, 12]} />
          <meshStandardMaterial color="#33445f" roughness={0.5} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.57, 0]}>
          <cylinderGeometry args={[0.07, 0.05, 0.08, 20]} />
          <meshStandardMaterial color="#8e99a8" roughness={0.4} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.69, 0]}>
          <sphereGeometry args={[0.1, 24, 18]} />
          <meshStandardMaterial
            ref={bulbMaterial}
            color="#82827c"
            emissive="#ffd79a"
            emissiveIntensity={0}
            roughness={0.2}
            metalness={0}
            transparent
            opacity={0.88}
          />
        </mesh>
        <pointLight ref={glow} position={[0, 0.69, 0]} intensity={0} distance={3.2} color="#ffd79a" />
      </group>

      {/* Circuit: one electrode to the lamp, the lamp back to the other.

          Both runs climb clear of the rim before they cross the beaker, then
          come down beside the lamp rather than through it. The bulb is a
          sphere of radius 0.1 and the base a disc of 0.19, so the two descents
          are set 0.2 and 0.24 out from the centre line and only step in at the
          height of the terminal they are joining. */}
      <WirePath
        points={[
          [ELECTRODE_X, HOLDER_HEIGHT + 0.03, 0.05],
          [ELECTRODE_X, HOLDER_HEIGHT + 0.17, 0.05],
          [LAMP[0] + 0.2, HOLDER_HEIGHT + 0.17, LAMP[2]],
          [LAMP[0] + 0.2, 0.57, LAMP[2]],
          [LAMP[0] + 0.075, 0.57, LAMP[2]],
        ]}
      />
      <WirePath
        points={[
          [-ELECTRODE_X, HOLDER_HEIGHT + 0.03, -0.05],
          [-ELECTRODE_X, HOLDER_HEIGHT + 0.29, -0.05],
          [LAMP[0] - 0.24, HOLDER_HEIGHT + 0.29, LAMP[2]],
          [LAMP[0] - 0.24, 0.04, LAMP[2]],
          [LAMP[0] - 0.17, 0.04, LAMP[2]],
        ]}
      />
    </group>
  );
}
