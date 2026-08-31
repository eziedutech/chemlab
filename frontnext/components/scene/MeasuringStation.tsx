"use client";

import { useFrame } from "@react-three/fiber";
import { measuringDuration, useLabStore, type PourJob } from "../../store/labStore";
import { Vessel } from "./Vessel";

/** What stands on the bench, in the order the positions run. */
const BENCH: { kind: "pour" | "scoop" }[] = [
  { kind: "pour" },
  { kind: "pour" },
  { kind: "scoop" },
];

/**
 * The bench where reagents are measured out before anything is combined.
 *
 * The apparatus stands there whether or not an experiment is running: two
 * graduated cylinders and a spatula, empty until they are needed. Nothing
 * appears out of nowhere when the agent acts, and a visitor can see what the
 * lab is equipped to do before asking for anything.
 *
 * Nothing goes into the beaker until every vessel has been filled and is
 * standing there to be read, which is how the procedure runs and the only way
 * to see what went in and how much of it.
 */
export function MeasuringStation() {
  const mix = useLabStore((state) => state.mix);
  const beginAdding = useLabStore((state) => state.beginAdding);

  useFrame(() => {
    const current = useLabStore.getState().mix;
    if (!current || current.stage !== "measuring") return;
    const count = current.jobs.filter((job) => job.kind !== "drop").length;
    if (Date.now() - current.startedAt >= measuringDuration(count)) {
      beginAdding();
    }
  });

  // Each job takes the bench position that suits it: liquids to the cylinders
  // in order, a powder to the spatula. An object is carried in by hand and
  // takes no position here.
  const jobs = mix ? mix.jobs.filter((job) => job.kind !== "drop") : [];
  const pours = jobs.filter((job) => job.kind === "pour");
  const scoops = jobs.filter((job) => job.kind === "scoop");

  return (
    <group>
      {BENCH.map((slot, index) => {
        const job: PourJob | null =
          slot.kind === "scoop" ? scoops[0] ?? null : pours[index] ?? null;

        return (
          <Vessel
            key={index}
            slotIndex={index}
            total={BENCH.length}
            kind={slot.kind}
            job={job}
            orderIndex={job ? jobs.indexOf(job) : 0}
          />
        );
      })}
    </group>
  );
}
