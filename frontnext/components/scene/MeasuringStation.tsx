"use client";

import { useFrame } from "@react-three/fiber";
import { measuringDuration, useLabStore } from "../../store/labStore";
import { Vessel } from "./Vessel";

/**
 * The bench where reagents are measured out before anything is combined.
 *
 * Nothing goes into the beaker until every vessel has been filled and is
 * standing there to be read, which is both how the procedure actually runs and
 * the only way a student can see what went in and how much of it.
 */
export function MeasuringStation() {
  const mix = useLabStore((state) => state.mix);
  const beginAdding = useLabStore((state) => state.beginAdding);

  // Vessels stand on the bench. An object is carried in by hand instead, and
  // is handled elsewhere, so it takes no slot here.
  const vessels = mix ? mix.jobs.filter((job) => job.kind !== "drop") : [];

  useFrame(() => {
    const current = useLabStore.getState().mix;
    if (!current || current.stage !== "measuring") return;
    const count = current.jobs.filter((job) => job.kind !== "drop").length;
    if (Date.now() - current.startedAt >= measuringDuration(count)) {
      beginAdding();
    }
  });

  if (!mix) return null;

  return (
    <group>
      {vessels.map((job, index) => (
        <Vessel
          key={job.id}
          job={job}
          index={index}
          total={vessels.length}
        />
      ))}
    </group>
  );
}
