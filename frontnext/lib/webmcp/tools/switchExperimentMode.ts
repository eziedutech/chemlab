import type { ToolDescriptor, ToolResult } from "../getModelContext";
import { useLabStore, type Subject, type Topic } from "../../../store/labStore";

/** Which subject each topic belongs to, and what the scene needs to show. */
const TOPIC_TABLE: Record<
  Topic,
  { subject: Subject; scene: string; substances: string[]; nextStep: string }
> = {
  asam_basa: {
    subject: "kimia",
    scene: "AcidBaseScene",
    substances: ["cuka", "baking_soda", "air", "lakmus"],
    nextStep: "Call mix_substances with cuka and baking_soda.",
  },
  elektrolit: {
    subject: "kimia",
    scene: "ElectrolyteScene",
    substances: ["air_garam", "air_gula", "air_suling", "cuka"],
    nextStep: "Call mix_substances with air and garam, then read the lamp brightness.",
  },
  massa_jenis: {
    subject: "fisika",
    scene: "DensityScene",
    substances: ["air_tawar", "air_garam", "telur"],
    nextStep: "Call mix_substances with air and garam, then drop the telur into the beaker.",
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
      available_substances: entry.substances,
      suggested_next_step: entry.nextStep,
    };
  },
};
