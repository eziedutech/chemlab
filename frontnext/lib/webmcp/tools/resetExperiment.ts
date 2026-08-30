import type { ToolDescriptor, ToolResult } from "../getModelContext";
import { useLabStore } from "../../../store/labStore";

export const resetExperiment: ToolDescriptor = {
  name: "reset_experiment",
  description:
    "Empty the beaker and start the current topic over from the beginning.",
  inputSchema: {
    type: "object",
    properties: { keep_observation_log: { type: "boolean", default: false } },
  },
  execute: async (input): Promise<ToolResult> => {
    useLabStore.getState().pushAgentActivity("reset_experiment");

    const keepObservationLog = Boolean(input?.keep_observation_log ?? false);
    useLabStore.getState().resetExperiment(keepObservationLog);

    return {
      success: true,
      active_topic: useLabStore.getState().activeTopic,
      beaker_cleared: true,
      observation_log_kept: keepObservationLog,
    };
  },
};
