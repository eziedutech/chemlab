import type { ToolDescriptor, ToolResult } from "../getModelContext";
import {
  availablePairs,
  TOPIC_SUBSTANCES,
} from "../../reactions/reactionDefinitions";
import { useLabStore, type Subject, type Topic } from "../../../store/labStore";

/** Which subject each topic belongs to, and what the scene shows. */
const TOPIC_TABLE: Record<
  Topic,
  { subject: Subject; scene: string; apparatus: string[]; nextStep: string }
> = {
  asam_basa: {
    subject: "kimia",
    scene: "AcidBaseScene",
    apparatus: ["beaker", "reagent bottle"],
    nextStep: "Call mix_substances with cuka and baking_soda.",
  },
  elektrolit: {
    subject: "kimia",
    scene: "ElectrolyteScene",
    apparatus: ["beaker", "reagent bottle", "two electrodes", "test lamp"],
    nextStep: "Call mix_substances with air and garam, then read the lamp brightness.",
  },
  massa_jenis: {
    subject: "fisika",
    scene: "DensityScene",
    apparatus: ["beaker", "reagent bottle", "egg"],
    nextStep:
      "Call mix_substances with air and telur to see it sink, then reset and try air_garam and telur.",
  },
};

export const switchExperimentMode: ToolDescriptor = {
  name: "switch_experiment_mode",
  description:
    "Switch the active subject and experiment topic. The 3D scene changes to match the chosen topic.",
  inputSchema: {
    type: "object",
    properties: {
      subject: { type: "string", enum: ["kimia", "fisika"] },
      topic: { type: "string", enum: ["asam_basa", "elektrolit", "massa_jenis"] },
    },
    required: ["subject", "topic"],
  },
  execute: async ({ subject, topic }): Promise<ToolResult> => {
    useLabStore.getState().pushAgentActivity("switch_experiment_mode");

    const entry = TOPIC_TABLE[topic as Topic];
    if (!entry) {
      return {
        success: false,
        reason: "unknown_topic",
        available_topics: Object.keys(TOPIC_TABLE),
      };
    }
    if (entry.subject !== subject) {
      return {
        success: false,
        reason: "subject_topic_mismatch",
        expected_subject: entry.subject,
        received_subject: subject,
      };
    }

    useLabStore.getState().setActiveExperiment(entry.subject, topic as Topic);

    return {
      success: true,
      active_subject: entry.subject,
      active_topic: topic,
      scene: entry.scene,
      apparatus: entry.apparatus,
      available_substances: TOPIC_SUBSTANCES[topic as Topic],
      available_pairs: availablePairs(topic as Topic),
      beaker_cleared: true,
      suggested_next_step: entry.nextStep,
    };
  },
};
