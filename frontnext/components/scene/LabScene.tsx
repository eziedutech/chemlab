"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
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
      // Capping the pixel ratio is what keeps a school laptop at a usable frame rate.
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [1.95, 1.55, 3.15], fov: 36 }}
    >
      <color attach="background" args={["#0b1220"]} />

      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 5, 2]} intensity={1.5} color="#eaf4ff" />
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

      {/* Bench top. A slab that runs past the frame, so it reads as a work
          surface rather than a disc floating under the glass. The lab table
          model replaces it later. */}
      <mesh position={[0, -0.06, 0]}>
        <boxGeometry args={[14, 0.12, 14]} />
        <meshStandardMaterial color="#152135" roughness={0.92} metalness={0.04} />
      </mesh>

      <TopicScene />

      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.5}
        scale={5}
        blur={2.4}
        far={1.6}
        resolution={512}
        color="#03070f"
      />

      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        target={[-0.2, 0.58, 0]}
        minDistance={2}
        maxDistance={6}
        // Stop the camera from dropping below the bench.
        maxPolarAngle={Math.PI / 2 - 0.06}
        minPolarAngle={0.25}
      />
    </Canvas>
  );
}
