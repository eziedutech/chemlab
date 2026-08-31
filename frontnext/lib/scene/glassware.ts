import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import { Box3, Mesh, Vector3 } from "three";

/**
 * The imported glassware.
 *
 * One 178 KB file holding six named objects, of which two are used: the large
 * beaker and the tall measuring cylinder. It is modelled in centimetres with
 * each origin at the base of the piece, and the volume scale is printed into
 * the texture rather than modelled, so it costs a few hundred triangles.
 *
 * Everything is wrapped so a failure to load is survivable: the scene falls
 * back to the primitives it was built with rather than showing nothing.
 */

const MODEL_URL = "/models/glassware.glb";

export const GLASSWARE_NODES = {
  beaker: "lab_beaker_a",
  beakerSmall: "lab_beaker_b",
  cylinder: "lab_cylinder_a",
  cylinderShort: "lab_cylinder_c",
  erlenmeyer: "lab_erlenmeyer_a",
} as const;

export interface GlasswarePiece {
  /** Geometry, already centred on its own base at the origin. */
  mesh: Mesh;
  /** Height of the piece in model units, used to scale it into the scene. */
  height: number;
  /** Outer radius in model units. */
  radius: number;
}

/**
 * Reads one named object out of the file.
 *
 * The node is cloned rather than used directly, since the same file is shared
 * by the beaker and the measuring cylinders and each needs its own transform.
 */
export function useGlasswarePiece(
  nodeName: string,
): GlasswarePiece | null {
  const gltf = useGLTF(MODEL_URL) as unknown as {
    nodes: Record<string, Mesh | undefined>;
  };

  return useMemo(() => {
    const source = gltf.nodes?.[nodeName];
    if (!source || !source.geometry) return null;

    const mesh = source.clone() as Mesh;
    mesh.position.set(0, 0, 0);
    mesh.rotation.set(0, 0, 0);
    mesh.scale.set(1, 1, 1);

    const box = new Box3().setFromObject(mesh);
    const size = box.getSize(new Vector3());

    return {
      mesh,
      height: size.y,
      radius: Math.max(size.x, size.z) / 2,
    };
  }, [gltf, nodeName]);
}

useGLTF.preload(MODEL_URL);
