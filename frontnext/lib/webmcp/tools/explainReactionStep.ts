import type { ToolDescriptor, ToolResult } from "../getModelContext";
import { useLabStore } from "../../../store/labStore";

export const explainReactionStep: ToolDescriptor = {
  name: "explain_reaction_step",
  description:
    "Explain one step of the current reaction to the student, step by step, with an optional simple 2D diagram.",
  inputSchema: {
    type: "object",
    properties: {
      step_number: { type: "number", minimum: 1, maximum: 5 },
      show_diagram: {
        type: "boolean",
        description: "Render a simple 2D diagram alongside the explanation",
      },
    },
    required: ["step_number"],
  },
  execute: async ({ step_number, show_diagram = false }): Promise<ToolResult> => {
    useLabStore.getState().pushAgentActivity("explain_reaction_step");

    // Placeholder result. This will be served from pre-generated static text
    // through the backend, so no language model runs at demo time.
    return {
      success: true,
      step_number,
      total_steps: 4,
      show_diagram,
      explanation:
        "Acetic acid in the vinegar reacts with sodium bicarbonate, releasing carbon dioxide gas.",
      rendered_in: "ObservationPanel",
    };
  },
};
