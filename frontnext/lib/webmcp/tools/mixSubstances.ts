import type { ToolDescriptor, ToolResult } from "../getModelContext";
import {
  availablePairs,
  findReaction,
  normalizeSubstance,
  substanceColor,
  SUBSTANCES,
  TOPIC_SUBSTANCES,
} from "../../reactions/reactionDefinitions";
import { POUR_DURATION_MS, useLabStore, type PourJob } from "../../../store/labStore";

const BEAKER_CAPACITY_ML = 250;
const DEFAULT_AMOUNT_ML = 50;

export const mixSubstances: ToolDescriptor = {
  name: "mix_substances",
  description:
    "Mix two substances in the 3D simulation. Each reagent is lifted, carried over the beaker and poured in, then the liquid takes on the colour, bubbles or precipitate the reaction produces.",
  inputSchema: {
    type: "object",
    properties: {
      substance_a: { type: "string", description: "First substance, for example 'cuka'" },
      substance_b: { type: "string", description: "Second substance, for example 'baking_soda'" },
      amount_ml: {
        type: "number",
        description: "Total volume of the mixture in millilitres",
        minimum: 1,
        maximum: 500,
      },
    },
    required: ["substance_a", "substance_b"],
  },
  execute: async ({ substance_a, substance_b, amount_ml }): Promise<ToolResult> => {
    useLabStore.getState().pushAgentActivity("mix_substances");

    const store = useLabStore.getState();
    const topic = store.activeTopic;

    const a = normalizeSubstance(substance_a);
    const b = normalizeSubstance(substance_b);

    const unknown = [
      a ? null : substance_a,
      b ? null : substance_b,
    ].filter(Boolean);
    if (unknown.length > 0) {
      return {
        success: false,
        reason: "unknown_substance",
        unknown_substances: unknown,
        available_substances: TOPIC_SUBSTANCES[topic],
        known_substances: Object.keys(SUBSTANCES),
      };
    }

    const reaction = findReaction(topic, a as string, b as string);
    if (!reaction) {
      return {
        success: false,
        reason: "unknown_pair",
        active_topic: topic,
        requested_pair: `${a} + ${b}`,
        available_pairs: availablePairs(topic),
      };
    }

    // Clamp the request to what the glassware can hold, and say so rather than
    // silently pouring 500 ml into a 250 ml beaker.
    const requested =
      typeof amount_ml === "number" && Number.isFinite(amount_ml)
        ? amount_ml
        : DEFAULT_AMOUNT_ML;
    const startingVolume = store.beaker.volumeMl;
    const headroom = Math.max(0, BEAKER_CAPACITY_ML - startingVolume);
    const added = Math.min(Math.max(1, requested), headroom);
    const clamped = added < requested;

    // Only pour what is not already in the beaker.
    const toPour = [a as string, b as string].filter(
      (name) => !store.beaker.substances.includes(name),
    );

    const finalVolume = startingVolume + added;
    const outcome = {
      temperatureC: 25 + reaction.deltaC,
      lampBrightness: reaction.lampBrightness ?? 0,
      objectState: reaction.objectState ?? null,
    };

    if (toPour.length === 0) {
      // Nothing left to pour, so the reaction simply resolves in place.
      useLabStore.getState().enqueuePours([
        {
          substance: a as string,
          color: substanceColor(a as string),
          resultColor: reaction.resultColor,
          resultVolumeMl: finalVolume,
          resultBubbles: reaction.hasBubbles,
          resultPrecipitate: reaction.hasPrecipitate,
          outcome,
        },
      ]);
    } else {
      const share = added / toPour.length;
      const jobs: Omit<PourJob, "id">[] = toPour.map((name, index) => {
        const isLast = index === toPour.length - 1;
        return {
          substance: name,
          color: substanceColor(name),
          // Until the last reagent lands, the beaker just holds what was poured
          // so far. The reaction colour only appears once both are in.
          resultColor: isLast ? reaction.resultColor : substanceColor(name),
          resultVolumeMl: startingVolume + share * (index + 1),
          resultBubbles: isLast ? reaction.hasBubbles : false,
          resultPrecipitate: isLast ? reaction.hasPrecipitate : false,
          outcome: isLast ? outcome : undefined,
        };
      });
      useLabStore.getState().enqueuePours(jobs);
    }

    useLabStore.getState().appendObservation(reaction.observationEn);

    const pourCount = Math.max(1, toPour.length);

    return {
      success: true,
      reaction_id: reaction.id,
      active_topic: topic,
      substances: [a, b],
      amount_ml: added,
      amount_clamped: clamped,
      beaker_capacity_ml: BEAKER_CAPACITY_ML,
      visual: {
        color: reaction.resultColor,
        bubbles: reaction.hasBubbles,
        precipitate: reaction.hasPrecipitate,
      },
      temperature: {
        direction: reaction.temperatureChange,
        delta_c: reaction.deltaC,
        result_c: outcome.temperatureC,
      },
      lamp_brightness: reaction.lampBrightness ?? null,
      object_state: reaction.objectState ?? null,
      observation: reaction.observationEn,
      observation_id: reaction.observationId,
      // The pour is animated, so tell the agent how long the scene is busy.
      animation_ms: pourCount * POUR_DURATION_MS,
    };
  },
};
