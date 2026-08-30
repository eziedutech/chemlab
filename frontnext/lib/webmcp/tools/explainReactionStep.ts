import type { ToolDescriptor, ToolResult } from "../getModelContext";
import { fetchExplanation } from "../../api";
import { useLabStore } from "../../../store/labStore";

export const explainReactionStep: ToolDescriptor = {
  name: "explain_reaction_step",
  description:
    "Explain one step of the reaction in the active topic to the student, and show it in the observation panel. Steps run from 1 to 4 and build on each other.",
  inputSchema: {
    type: "object",
    properties: {
      step_number: { type: "number", minimum: 1, maximum: 5 },
      show_diagram: {
        type: "boolean",
        description: "Include the diagram hint for this step",
      },
      lang: {
        type: "string",
        enum: ["id", "en"],
        description: "Language of the explanation, Indonesian by default",
      },
    },
    required: ["step_number"],
  },
  execute: async ({ step_number, show_diagram = false, lang }): Promise<ToolResult> => {
    useLabStore.getState().pushAgentActivity("explain_reaction_step");

    const state = useLabStore.getState();
    // The agent may ask for a language; otherwise follow the interface.
    const language =
      lang === "en" || lang === "id" ? lang : state.uiLang;

    const response = await fetchExplanation({
      subject: state.activeSubject,
      topic: state.activeTopic,
      step_number: Number(step_number) || 1,
      reaction_context: state.beaker.substances.join(" + "),
      lang: language,
    });

    if (!response) {
      // The backend is unreachable. Say so plainly and keep the agent moving,
      // rather than throwing and leaving it with nothing to narrate.
      return {
        success: false,
        reason: "backend_unreachable",
        step_number,
        suggested_next_step:
          "Describe the step from your own knowledge, or try again in a moment.",
      };
    }

    useLabStore.getState().setPanel({
      kind: "explanation",
      title: response.title,
      body: response.explanation,
      points: show_diagram && response.diagram_svg_hint ? [response.diagram_svg_hint] : [],
      source: response.source,
      stepNumber: response.step_number,
      totalSteps: response.total_steps,
    });

    return {
      success: true,
      step_number: response.step_number,
      total_steps: response.total_steps,
      title: response.title,
      explanation: response.explanation,
      diagram_hint: show_diagram ? (response.diagram_svg_hint ?? null) : null,
      lang: language,
      source: response.source,
      rendered_in: "ObservationPanel",
      suggested_next_step:
        response.step_number < response.total_steps
          ? `Call explain_reaction_step with step_number ${response.step_number + 1}.`
          : "All steps are covered. Call render_lab_report to close the session.",
    };
  },
};
