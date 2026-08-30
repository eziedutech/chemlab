"use client";

import dynamic from "next/dynamic";

/**
 * Client side entry point for the 3D lab.
 *
 * WebGL has no meaning during server rendering, and the physics module added
 * later ships WebAssembly that breaks under SSR outright, so the scene is
 * loaded with ssr disabled. `next/dynamic` with `ssr: false` is only allowed
 * inside a client component, which is what this wrapper is for.
 */
const LabScene = dynamic(
  () => import("./LabScene").then((mod) => mod.LabScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
        Loading the lab bench
      </div>
    ),
  },
);

export function LabSceneCanvas() {
  return (
    <div className="h-full w-full">
      <LabScene />
    </div>
  );
}
