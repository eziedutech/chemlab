"use client";

import { useEffect, useState } from "react";
import { MeshTransmissionMaterial } from "@react-three/drei";
import { DoubleSide } from "three";

/**
 * Whether this device gets refracting glass.
 *
 * Transmission makes the renderer draw the scene an extra time each frame, so
 * it is reserved for a screen wide enough to suggest a laptop. Narrower screens
 * get the same shapes with a plain transparent material.
 */
export function useRefractingGlass(): boolean {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setAllowed(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return allowed;
}

/**
 * The material every piece of glassware on the bench shares.
 *
 * `transmissionSampler` is the reason this is affordable. Left to itself this
 * material renders the whole scene into a buffer of its own, once per piece of
 * glass per frame, and the bench holds four. With the sampler on it reads the
 * one transmission pass the renderer already makes for the frame, so four
 * pieces of glass cost what one costs.
 *
 * What it buys over a plain physical material is `anisotropicBlur`: it spreads
 * the refracted ray across several samples without touching the surface at
 * all. That is the distinction the glass was missing. Blur belongs to what you
 * see through the glass, the way a real vessel smears the bench behind it.
 * Roughness, which is the other way to get a blur, belongs to the surface, and
 * a rough surface is a frosted one. Roughness stays at zero here.
 */
export function LabGlass({ refracting }: { refracting: boolean }) {
  if (!refracting) {
    return (
      <meshPhysicalMaterial
        color="#ffffff"
        transparent
        opacity={0.2}
        roughness={0.03}
        metalness={0}
        ior={1.5}
        reflectivity={0.5}
        envMapIntensity={1.3}
        side={DoubleSide}
      />
    );
  }

  return (
    <MeshTransmissionMaterial
      transmissionSampler
      /* Each sample is a slightly different ray through the wall, and the
         spread between them is the blur. Six is where the smear stops looking
         like banding, and going higher only costs fill rate. */
      samples={6}
      transmission={1}
      color="#ffffff"
      /* Zero, and it stays zero. This is the surface, and the surface is
         polished glass. */
      roughness={0}
      /*
       * Thickness is what bends the view rather than what tints it.
       *
       * Straight through the middle the ray meets the wall square on and comes
       * out barely deflected, so the centre stays clear. Towards the sides it
       * crosses the curve at a slant and is thrown sideways, which is the
       * smearing a real beaker shows at its edges.
       */
      thickness={0.3}
      /* The blur, and the whole point of this material. It scales the
         thickness per sample, so the refracted image softens while the glass
         itself stays sharp. */
      anisotropicBlur={0.55}
      ior={1.5}
      metalness={0}
      /* Colour separation where the glass splits light, strongest at the
         edges where the ray bends most. */
      chromaticAberration={0.05}
      distortion={0}
      temporalDistortion={0}
      /* Pushed far out, so all that thickness costs nothing in colour: the
         glass bends the light without staining it. */
      attenuationColor="#ffffff"
      attenuationDistance={90}
      /*
       * Reflection turned up, now that there is something worth reflecting.
       *
       * The surround is no longer one flat grey, so a strong reflection no
       * longer spreads an even film. It picks up the bright ceiling on the
       * shoulders and the dark bench line down the sides, which is what gives
       * a clear vessel its outline.
       */
      reflectivity={0.55}
      envMapIntensity={1.4}
      /* Both sides. The lathed profile runs up the outside and back down the
         inside, so the inner wall faces the axis and would be culled away by
         front side rendering. That inner wall is half of what makes the
         refraction read as glass rather than as a soap bubble. */
      side={DoubleSide}
    />
  );
}
