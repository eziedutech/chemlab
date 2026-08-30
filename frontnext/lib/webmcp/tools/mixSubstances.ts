import type { ToolDescriptor, ToolResult } from "../getModelContext";
import {
  availablePairs,
  findReaction,
  normalizeSubstance,
  substanceColor,
  substanceKind,
  SUBSTANCES,
  TOPIC_SUBSTANCES,
} from "../../reactions/reactionDefinitions";
import {
  measuringDuration,
  POUR_DURATION_MS,
  useLabStore,
  type PourJob,
} from "../../../store/labStore";

const BEAKER_CAPACITY_ML = 250;
const DEFAULT_AMOUNT_ML = 50;

export const mixSubstances: ToolDescriptor = {
  name: "mix_substances",
  description:
    "Mix two substances in the 3D simulation. Each one is first measured out on the bench, liquids into graduated cylinders and powders onto a spatula, then added to the beaker one at a time, and the liquid takes on the colour, bubbles or precipitate the reaction produces.",
  inputSchema: {
    type: "object",
    properties: {
      substance_a: { type: "string", description: "First substance, for example 'cuka'" },
      substance_b: { type: "string", description: "Second substance, for example 'baking_soda'" },
      amount_ml: {
        type: "number",
        description:
          "Total volume of liquid to measure out, in millilitres. Powders and solid objects are not measured by volume.",
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

    // Measure out what is not already in the beaker. If both are in there
    // already the call is a top up, so both are measured again, except an
    // object, which does not go in twice.
    const missing = [a as string, b as string].filter(
      (name) => !store.beaker.substances.includes(name),
    );
    const names =
      missing.length > 0
        ? missing
        : [a as string, b as string].filter(
            (name) => substanceKind(name) !== "object",
          );

    if (names.length === 0) {
      return {
        success: false,
        reason: "nothing_to_add",
        beaker: store.beaker.substances,
        suggested_next_step: "Call reset_experiment to start this topic over.",
      };
    }

    // Volume comes from the liquids alone. A spoonful of powder dissolves into
    // the solution and an egg displaces liquid rather than adding any, so
    // neither is measured in millilitres.
    const liquidCount = names.filter(
      (name) => substanceKind(name) === "liquid",
    ).length;
    const added =
      liquidCount === 0 ? 0 : Math.min(Math.max(1, requested), headroom);
    const clamped = liquidCount > 0 && added < requested;

    const finalVolume = startingVolume + added;
    const outcome = {
      temperatureC: 25 + reaction.deltaC,
      lampBrightness: reaction.lampBrightness ?? 0,
      objectState: reaction.objectState ?? null,
    };

    const share = liquidCount > 0 ? added / liquidCount : 0;
    let runningVolume = startingVolume;

    const jobs: Omit<PourJob, "id">[] = names.map((name, index) => {
      const isLast = index === names.length - 1;
      const kindOfSubstance = substanceKind(name);
      const isLiquid = kindOfSubstance === "liquid";
      if (isLiquid) runningVolume += share;
      return {
        substance: name,
        kind:
          kindOfSubstance === "object"
            ? ("drop" as const)
            : kindOfSubstance === "powder"
              ? ("scoop" as const)
              : ("pour" as const),
        color: substanceColor(name),
        measuredMl: isLiquid ? share : 0,
        // Until the last reagent lands, the beaker just holds what was added
        // so far. The reaction colour only appears once both are in.
        resultColor: isLast ? reaction.resultColor : substanceColor(name),
        resultVolumeMl: isLast ? finalVolume : runningVolume,
        resultBubbles: isLast ? reaction.hasBubbles : false,
        resultPrecipitate: isLast ? reaction.hasPrecipitate : false,
        outcome: isLast ? outcome : undefined,
      };
    });

    useLabStore.getState().startMix(jobs);
    useLabStore.getState().appendObservation(reaction.observationEn);

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
      // What the bench shows: each vessel and the measure it was filled to.
      measured_out: jobs.map((job) => ({
        substance: job.substance,
        vessel:
          job.kind === "pour"
            ? "measuring cylinder"
            : job.kind === "scoop"
              ? "spatula"
              : "by hand",
        measured_ml: job.measuredMl || null,
      })),
      // Everything is measured out first, then added one vessel at a time, so
      // tell the agent how long the scene is busy before it acts again.
      animation_ms:
        measuringDuration(jobs.length) + jobs.length * POUR_DURATION_MS,
    };
  },
};
