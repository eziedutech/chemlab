import type { ToolDescriptor, ToolResult } from "../getModelContext";
import { useLabStore, type Severity } from "../../../store/labStore";

const AUTO_DISMISS_MS = 8000;

export const triggerSafetyAlert: ToolDescriptor = {
  name: "trigger_safety_alert",
  description:
    "Show an educational safety alert when a combination of substances needs extra care, teaching safety awareness as part of the lesson.",
  inputSchema: {
    type: "object",
    properties: {
      reason: {
        type: "string",
        description:
          "Why the alert is raised, for example 'Exothermic reaction, the temperature rises quickly'",
      },
      severity: { type: "string", enum: ["info", "warning"], default: "info" },
    },
    required: ["reason"],
  },
  execute: async ({ reason, severity = "info" }): Promise<ToolResult> => {
    useLabStore.getState().pushAgentActivity("trigger_safety_alert");

    useLabStore.getState().setSafetyAlert({ reason, severity: severity as Severity });

    return {
      success: true,
      displayed: true,
      reason,
      severity,
      auto_dismiss_ms: AUTO_DISMISS_MS,
    };
  },
};
