"use client";

import { Beaker } from "./Beaker";
import { ElectrolyteRig } from "./ElectrolyteRig";
import { FallingObject } from "./FallingObject";
import { PouringReagent } from "./PouringReagent";
import { useLabStore } from "../../store/labStore";

/**
 * Every topic shares the beaker and the reagent bottle. What changes is the
 * apparatus around them, which is why switching topics is worth watching:
 * electrodes and a lamp appear for the conductivity test, an egg for the
 * density test.
 */
export function TopicScene() {
  const topic = useLabStore((state) => state.activeTopic);

  return (
    <group>
      <Beaker />
      <PouringReagent />
      {topic === "elektrolit" && <ElectrolyteRig />}
      {topic === "massa_jenis" && <FallingObject />}
    </group>
  );
}
