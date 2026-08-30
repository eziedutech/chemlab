import type { ToolDescriptor, ToolResult } from "../getModelContext";
import { useLabStore } from "../../../store/labStore";

export const mixSubstances: ToolDescriptor = {
  name: "mix_substances",
  description:
    "Mix two substances in the 3D simulation and trigger the resulting visual change: colour, bubbles, or a precipitate.",
  inputSchema: {
    type: "object",
    properties: {
      substance_a: { type: "string", description: "First substance, for example 'cuka'" },
      substance_b: { type: "string", description: "Second substance, for example 'baking_soda'" },
      amount_ml: { type: "number", description: "Amount in millilitres", minimum: 1, maximum: 500 },
    },
    required: ["substance_a", "substance_b"],
  },
  execute: async ({ substance_a, substance_b, amount_ml = 50 }): Promise<ToolResult> => {
    useLabStore.getState().pushAgentActivity("mix_substances");

    // Placeholder result. The real lookup against reactionDefinitions, with
    // input normalisation and order independent pair matching, lands next.
    return {
      success: true,
      reaction_id: "acid_base_co2",
      substances: [substance_a, substance_b],
      amount_ml,
      visual: { color: "#e8f4d4", bubbles: true, precipitate: false },
      temperature: { direction: "endoterm", delta_c: -3 },
      observation:
        "The solution fizzes vigorously, gas bubbles rise to the surface, and the beaker wall feels colder.",
    };
  },
};
