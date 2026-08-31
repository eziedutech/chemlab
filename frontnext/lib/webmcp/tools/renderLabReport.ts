import type { ToolDescriptor, ToolResult } from "../getModelContext";
import { fetchLabReport } from "../../api";
import { useLabStore } from "../../../store/labStore";

export const renderLabReport: ToolDescriptor = {
  name: "render_lab_report",
  description:
    "Write up the experiment as an observation report and show it in the observation panel. Call this once the reaction has been observed and explained.",
  inputSchema: {
    type: "object",
    properties: {
      observations: {
        type: "string",
        description: "What was observed during the experiment",
      },
      conclusion: {
        type: "string",
        description: "The conclusion the student should take away",
      },
      lang: {
        type: "string",
        enum: ["id", "en"],
        description: "Language of the report, Indonesian by default",
      },
    },
    required: ["observations"],
  },
  execute: async ({ observations, conclusion, lang }): Promise<ToolResult> => {
    useLabStore.getState().pushAgentActivity("render_lab_report");

    const state = useLabStore.getState();
    // The agent may ask for a language; otherwise follow the interface.
    const language =
      lang === "en" || lang === "id" ? lang : state.uiLang;

    // Anything the agent leaves out is filled in from what the lab itself
    // recorded, so a report never comes back empty.
    const text =
      typeof observations === "string" && observations.trim().length > 0
        ? observations.trim()
        : state.observationLog.map((entry) => entry.en).join(" ");

    if (!text) {
      return {
        success: false,
        reason: "no_observations",
        suggested_next_step:
          "Run mix_substances first, then call render_lab_report again.",
      };
    }

    const response = await fetchLabReport({
      topic: state.activeTopic,
      observations: text,
      conclusion_draft: typeof conclusion === "string" ? conclusion : undefined,
      lang: language,
    });

    if (!response) {
      return {
        success: false,
        reason: "backend_unreachable",
        suggested_next_step:
          "Summarise the experiment yourself, or try again in a moment.",
      };
    }

    useLabStore.getState().setPanel({
      kind: "report",
      title: language === "en" ? "Observation report" : "Laporan pengamatan",
      body: response.formatted_report,
      points: response.learning_points,
      source: response.source,
    });

    return {
      success: true,
      formatted_report: response.formatted_report,
      learning_points: response.learning_points,
      lang: language,
      // Honest about where the words came from: written now by the model, read
      // back from the cache, or the prepared text when the provider is out.
      source: response.source,
      rendered_in: "ObservationPanel",
    };
  },
};
