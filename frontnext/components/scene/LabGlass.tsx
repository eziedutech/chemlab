"use client";

import { useEffect, useState } from "react";
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
 * It is a physical material with transmission rather than one of the heavier
 * transmission materials, and that is deliberate: the renderer keeps a single
 * transmission pass for the whole frame, so the beaker and both measuring
 * cylinders together cost one extra draw of the scene rather than three.
 *
 * The glass is thin and barely attenuating. Thicker settings tint it towards
 * the unlit room behind it, and it stops looking like laboratory glass.
 */
export function LabGlass({ refracting }: { refracting: boolean }) {
  if (!refracting) {
    return (
      <meshPhysicalMaterial
        color="#e7f1fb"
        transparent
        opacity={0.3}
        roughness={0.05}
        metalness={0}
        ior={1.45}
        reflectivity={0.6}
        envMapIntensity={2}
        side={DoubleSide}
      />
    );
  }

  return (
    <meshPhysicalMaterial
      color="#ffffff"
      transmission={1}
      thickness={0.05}
      roughness={0.05}
      metalness={0}
      ior={1.45}
      reflectivity={0.7}
      envMapIntensity={2.2}
      specularIntensity={1}
      attenuationColor="#f4faff"
      attenuationDistance={14}
      side={DoubleSide}
    />
  );
}
