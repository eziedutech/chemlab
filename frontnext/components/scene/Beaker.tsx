"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, DoubleSide, SRGBColorSpace } from "three";
import { useLabStore } from "../../store/labStore";

const OUTER_RADIUS = 0.5;
const WALL_HEIGHT = 0.92;
const LIQUID_RADIUS = OUTER_RADIUS - 0.025;
const BASE_HEIGHT = 0.024;
/** Volume that fills the beaker to the brim, used to map millilitres to height. */
const FULL_VOLUME_ML = 250;
const MAX_LIQUID_HEIGHT = WALL_HEIGHT * 0.82;

/** World height of the liquid surface for a given volume. */
function surfaceHeight(volumeMl: number): number {
  const ratio = Math.min(1, Math.max(0, volumeMl / FULL_VOLUME_ML));
  return BASE_HEIGHT + ratio * MAX_LIQUID_HEIGHT;
}

/**
 * Volume scale printed on the glass, drawn to a canvas and wrapped around the
 * beaker. Ticks sit at the height the liquid actually reaches for that volume,
 * so a student can read the level off the marks instead of guessing.
 *
 * It is a texture rather than geometry for the same reason real glassware
 * prints it: raised marks would cost far more triangles than the whole beaker.
 */
function useGraduationTexture(): CanvasTexture | null {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;

    // The canvas aspect has to match the surface it wraps, circumference
    // against wall height, otherwise the figures come out stretched.
    const width = 1024;
    const height = Math.round(
      (width * WALL_HEIGHT) / (2 * Math.PI * OUTER_RADIUS),
    );
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // The scale occupies one narrow sector of the circumference, as on a real
    // beaker, so it does not wrap the whole glass.
    const left = 40;
    const majorLength = 84;
    const minorLength = 46;

    const yForVolume = (volumeMl: number) =>
      (1 - surfaceHeight(volumeMl) / WALL_HEIGHT) * height;

    ctx.lineCap = "butt";

    // Minor ticks every 10 ml, major ticks with a figure every 50 ml.
    for (let volume = 10; volume <= FULL_VOLUME_ML; volume += 10) {
      const isMajor = volume % 50 === 0;
      const y = yForVolume(volume);

      ctx.beginPath();
      ctx.strokeStyle = isMajor ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.4)";
      ctx.lineWidth = isMajor ? 3.5 : 2;
      ctx.moveTo(left, y);
      ctx.lineTo(left + (isMajor ? majorLength : minorLength), y);
      ctx.stroke();

      if (isMajor) {
        ctx.fillStyle = "rgba(255,255,255,0.82)";
        ctx.font = "600 26px ui-sans-serif, system-ui, sans-serif";
        ctx.textBaseline = "middle";
        ctx.fillText(String(volume), left + majorLength + 12, y);
      }
    }

    // Unit label, sitting beside the top mark rather than above it, where the
    // curve of the rim would cut it off.
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = "500 22px ui-sans-serif, system-ui, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText("mL", left + majorLength + 74, yForVolume(FULL_VOLUME_ML));

    const canvasTexture = new CanvasTexture(canvas);
    canvasTexture.colorSpace = SRGBColorSpace;
    return canvasTexture;
  }, []);

  useEffect(() => () => texture?.dispose(), [texture]);

  return texture;
}

/**
 * A laboratory beaker built from primitives: an open ended wall, a base disc,
 * a rim, the printed volume scale, and the liquid inside it.
 *
 * The glass is a transparent physical material rather than a transmissive one.
 * Transmission renders the scene a second time per frame, which is exactly the
 * cost a school laptop cannot absorb, and at this scale it buys very little.
 */
export function Beaker() {
  const beaker = useLabStore((state) => state.beaker);
  const graduations = useGraduationTexture();

  const liquidHeight = useMemo(
    () => surfaceHeight(beaker.volumeMl) - BASE_HEIGHT,
    [beaker.volumeMl],
  );

  return (
    <group>
      {/* Glass wall, open at both ends so it reads as hollow. */}
      <mesh position={[0, WALL_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[OUTER_RADIUS, OUTER_RADIUS, WALL_HEIGHT, 48, 1, true]} />
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

      {/* Printed volume scale, on a shell just outside the glass. */}
      {graduations && (
        <mesh position={[0, WALL_HEIGHT / 2, 0]} rotation={[0, -0.35, 0]}>
          <cylinderGeometry
            args={[OUTER_RADIUS + 0.004, OUTER_RADIUS + 0.004, WALL_HEIGHT, 48, 1, true]}
          />
          <meshBasicMaterial
            map={graduations}
            transparent
            depthWrite={false}
            side={DoubleSide}
          />
        </mesh>
      )}

      {/* Base. */}
      <mesh position={[0, BASE_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[OUTER_RADIUS, OUTER_RADIUS, BASE_HEIGHT, 48]} />
        <meshPhysicalMaterial
          color="#cfe4f2"
          transparent
          opacity={0.35}
          roughness={0.08}
          metalness={0}
          ior={1.45}
        />
      </mesh>

      {/* Rim, the thickened lip a real beaker has. */}
      <mesh position={[0, WALL_HEIGHT, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[OUTER_RADIUS, 0.016, 12, 48]} />
        <meshPhysicalMaterial
          color="#dcecf7"
          transparent
          opacity={0.5}
          roughness={0.1}
          metalness={0}
        />
      </mesh>

      {/* Liquid, shown only once something has been poured in. */}
      {liquidHeight > 0.001 && (
        <group position={[0, BASE_HEIGHT + liquidHeight / 2, 0]}>
          <mesh>
            <cylinderGeometry args={[LIQUID_RADIUS, LIQUID_RADIUS, liquidHeight, 48]} />
            <meshStandardMaterial
              color={beaker.color}
              transparent
              opacity={0.86}
              roughness={0.25}
              metalness={0}
            />
          </mesh>
          {/* Slightly brighter disc at the surface, so the meniscus is legible. */}
          <mesh position={[0, liquidHeight / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[LIQUID_RADIUS, 48]} />
            <meshStandardMaterial
              color={beaker.color}
              transparent
              opacity={0.95}
              roughness={0.12}
              metalness={0}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}
