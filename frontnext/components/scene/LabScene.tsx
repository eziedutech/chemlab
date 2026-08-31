"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { COUNTER_HEIGHT, LabRoom } from "./LabRoom";

/**
 * How much the room is enlarged. A real beaker is about 10 cm tall and this one
 * is 0.92 units, so a metre of room is a little over nine units of scene.
 */
const ROOM_SCALE = 9.2;
import { TopicScene } from "./TopicScene";

/**
 * Root of the 3D lab.
 *
 * Lighting comes from drei helpers rather than a hand rolled rig. The
 * environment is built from Lightformers instead of a preset, because presets
 * download an HDR from a public CDN and the judges' network is not something to
 * gamble on.
 */
export function LabScene() {
  return (
    <Canvas
      // Capping the pixel ratio is what keeps a school laptop at a usable frame
      // rate, and it matters more now that the canvas fills the window.
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [4.4, 2.7, 6.0], fov: 38 }}
    >
      <color attach="background" args={["#141b26"]} />

      <ambientLight intensity={0.62} />
      <directionalLight position={[3, 5, 2]} intensity={1.6} color="#eaf4ff" />
      {/* A soft light just above the bench, so the glassware is lit from the
          side the camera is on rather than only from behind. */}
      <pointLight position={[1.6, 2.2, 2.4]} intensity={0.7} color="#eaf4ff" />
      <directionalLight position={[-3, 2, -2]} intensity={0.5} color="#8fb6d9" />

      <Environment resolution={128}>
        <Lightformer form="rect" intensity={2.2} position={[0, 3, 1]} scale={[6, 3, 1]} />
        <Lightformer
          form="rect"
          intensity={0.9}
          color="#7fd7ff"
          position={[-3, 1, 2]}
          scale={[3, 3, 1]}
          rotation={[0, Math.PI / 3, 0]}
        />
        <Lightformer
          form="rect"
          intensity={0.7}
          color="#b6c7e6"
          position={[3, 1, -2]}
          scale={[3, 3, 1]}
          rotation={[0, -Math.PI / 3, 0]}
        />
      </Environment>

      {/* The room, drawn in metres and scaled up until the beaker reads as the
          250 ml piece of glassware it is. The scale puts the bench top exactly
          at the origin, so everything standing on it keeps the coordinates it
          always had. */}
      <group position={[0, -COUNTER_HEIGHT * ROOM_SCALE, 0]} scale={ROOM_SCALE}>
        <LabRoom />
      </group>

      {/* The glassware model loads asynchronously; until it arrives the scene
          simply renders without it. */}
      <Suspense fallback={null}>
        <TopicScene />
      </Suspense>

      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.5}
        scale={5}
        blur={2.4}
        far={1.6}
        resolution={256}
        color="#03070f"
      />

      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        target={[-0.5, 0.5, 0]}
        minDistance={4}
        maxDistance={26}
        // Stop the camera from dropping below the bench.
        maxPolarAngle={Math.PI / 2 - 0.06}
        minPolarAngle={0.25}
      />
    </Canvas>
  );
}
