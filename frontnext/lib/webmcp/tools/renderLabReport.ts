import type { ToolDescriptor, ToolResult } from "../getModelContext";
import { useLabStore } from "../../../store/labStore";

export const renderLabReport: ToolDescriptor = {
  name: "render_lab_report",
  description:
    "Compose and display the observation report once the experiment is finished.",
  inputSchema: {
    type: "object",
    properties: {
      observations: {
        type: "string",
        description: "Summary of what was observed during the simulation",
      },
      conclusion: { type: "string", description: "The learning conclusion" },
    },
    required: ["observations"],
  },
  execute: async ({ observations, conclusion = "" }): Promise<ToolResult> => {
    useLabStore.getState().pushAgentActivity("render_lab_report");

    // Placeholder result. The real report is written by the backend, which is
    // the only endpoint that calls the language model at runtime.
    return {
      success: true,
      formatted_report: `Observations: ${observations}\nConclusion: ${conclusion}`,
      learning_points: [
        "An acid and a base react to produce carbon dioxide gas.",
        "The temperature drop shows the reaction is endothermic.",
      ],
      rendered_in: "ObservationPanel",
    };
  },
};
