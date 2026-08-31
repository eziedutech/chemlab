"use client";

import { useEffect, useMemo } from "react";
import { BackSide } from "three";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { COUNTER_HEIGHT, LabRoom } from "./LabRoom";
import { createRoomEnvironmentTexture } from "../../lib/scene/roomEnvironment";

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
  const room = useMemo(() => createRoomEnvironmentTexture(), []);
  useEffect(() => () => room?.dispose(), [room]);

  return (
    <Canvas
      // Capping the pixel ratio is what keeps a school laptop at a usable frame
      // rate, and it matters more now that the canvas fills the window.
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [4.7, 1.72, 4.7], fov: 38 }}
    >
      <color attach="background" args={["#141b26"]} />

      {/* Ambient kept low on purpose. A high ambient lifts every surface by
          the same amount, which flattens the difference between the lit face
          of the glass and its shaded one, and it is that difference the eye
          reads as a solid, clear object. The room now does the filling. */}
      <ambientLight intensity={0.42} />
      <directionalLight position={[3, 5, 2]} intensity={1.9} color="#f2f8ff" />
      {/* A soft light just above the bench, so the glassware is lit from the
          side the camera is on rather than only from behind. */}
      <pointLight position={[1.6, 2.2, 2.4]} intensity={0.5} color="#eaf4ff" />
      <directionalLight position={[-3, 2, -2]} intensity={0.5} color="#8fb6d9" />

      {/* What the glass reflects.
          Highlights on glass are reflections of whatever light source is in
          front of it, so their shape is the shape of the source: narrow strips
          give the thin white lines that run down a cylinder, and a broad panel
          gives the soft sheen along the rim. This is about placing white, not
          about making the glass whiter. */}
      <Environment resolution={256}>
        {/*
          The surround itself.

          An environment built only from lightformers is black everywhere they
          are not, so glass reflects mostly black and comes out looking tinted,
          like a film on a window. Filling it with one flat neutral fixes that
          and introduces the opposite fault: the same grey at every angle is an
          even film across the whole surface, and an even film is what frosted
          glass looks like.

          So the sphere carries a picture of a room instead. Bright overhead,
          mid toned at eye level, dark below the bench line, with a few window
          panels and a few dark uprights. Reflected off a curved wall those
          bands become the bright and dark lines that run down a real beaker,
          and the dark ones are what draw its outline.
        */}
        <mesh scale={60}>
          <sphereGeometry args={[1, 48, 32]} />
          <meshBasicMaterial map={room ?? undefined} color={room ? "#ffffff" : "#97a3b1"} side={BackSide} />
        </mesh>

        {/* Soft fill, so the glass is not lit only by hard edges. */}
        <Lightformer form="rect" intensity={1.6} position={[0, 3, 1.6]} scale={[7, 2.4, 1]} />

        {/* The strips that draw the vertical highlights. */}
        <Lightformer
          form="rect"
          intensity={14}
          color="#ffffff"
          position={[-1.1, 1.5, 2.2]}
          scale={[0.09, 2.6, 1]}
        />
        <Lightformer
          form="rect"
          intensity={10}
          color="#ffffff"
          position={[1.35, 1.6, 1.9]}
          scale={[0.07, 2.2, 1]}
          rotation={[0, -0.3, 0]}
        />
        {/* A low, wide one to pick out the base and the foot. */}
        <Lightformer
          form="rect"
          intensity={4}
          color="#eaf4ff"
          position={[0.2, 0.35, 2.4]}
          scale={[2.4, 0.12, 1]}
        />

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

      <TopicScene />

      {/* Shadow in two layers, because a real one is two things at once.

          A single hard pool under the glass is what made these look stamped
          on. Near the base, where the glass meets the bench, the shadow is
          small and dark and has an edge. Just beyond it the light wraps round
          and it opens out into a faint darkening with no edge at all, then
          stops: the lamp is directly overhead, so nothing here throws a long
          shadow. Drawing only the first gives a sticker; drawing only the
          second leaves the glassware floating. */}
      <ContactShadows
        position={[0, 0.004, 0]}
        opacity={0.44}
        scale={2.1}
        blur={2.2}
        far={0.34}
        resolution={256}
        color="#05090f"
      />
      <ContactShadows
        position={[0, 0.003, 0]}
        opacity={0.2}
        scale={3.6}
        blur={4}
        far={0.85}
        resolution={256}
        color="#070c14"
      />

      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        /* A shade above the middle of the glassware rather than at its foot.
           Aiming low tips the whole view down onto the bench top, which puts
           the eye somewhere no one stands. */
        target={[-0.68, 0.58, 0]}
        minDistance={4}
        maxDistance={26}
        // Stop the camera from dropping below the bench.
        maxPolarAngle={Math.PI / 2 - 0.06}
        minPolarAngle={0.25}
      />
    </Canvas>
  );
}
