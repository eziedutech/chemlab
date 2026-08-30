import { getModelContext, type ToolDescriptor } from "./getModelContext";
import { switchExperimentMode } from "./tools/switchExperimentMode";
import { mixSubstances } from "./tools/mixSubstances";
import { explainReactionStep } from "./tools/explainReactionStep";
import { renderLabReport } from "./tools/renderLabReport";
import { triggerSafetyAlert } from "./tools/triggerSafetyAlert";
import { getLabState } from "./tools/getLabState";
import { resetExperiment } from "./tools/resetExperiment";
import { useLabStore } from "../../store/labStore";

/**
 * Wraps a tool so the activity console learns how the call ended.
 *
 * The tool itself still logs the call on its first line, which is what proves
 * the call happened at all; this only fills in the outcome afterwards, in one
 * place rather than seven.
 */
function withResultLogging(tool: ToolDescriptor): ToolDescriptor {
  return {
    ...tool,
    execute: async (input: unknown) => {
      try {
        const result = await tool.execute(input);
        const ok =
          typeof result === "object" &&
          result !== null &&
          (result as { success?: unknown }).success === true;
        useLabStore.getState().markActivityResult(tool.name, ok);
        return result;
      } catch (error) {
        useLabStore.getState().markActivityResult(tool.name, false);
        throw error;
      }
    },
  };
}

/** The seven tools the agent drives the lab with. */
export const toolDescriptors: ToolDescriptor[] = [
  switchExperimentMode,
  mixSubstances,
  explainReactionStep,
  renderLabReport,
  triggerSafetyAlert,
  getLabState,
  resetExperiment,
].map(withResultLogging);

export const toolNames: string[] = toolDescriptors.map((tool) => tool.name);

export interface RegistrationResult {
  /** False when the browser exposes no WebMCP entry point at all. */
  detected: boolean;
  registered: string[];
  unregister: () => void;
}

/**
 * Register every tool with the browser.
 *
 * Registration is idempotent: each tool is unregistered first, so React
 * StrictMode mounting the effect twice in development cannot produce duplicate
 * entries. The caller returns `unregister` from its cleanup function.
 */
export function registerTools(): RegistrationResult {
  const modelContext = getModelContext();

  if (!modelContext) {
    return { detected: false, registered: [], unregister: () => {} };
  }

  for (const tool of toolDescriptors) {
    modelContext.unregisterTool?.(tool.name);
    modelContext.registerTool(tool);
  }

  return {
    detected: true,
    registered: [...toolNames],
    unregister: () => {
      for (const tool of toolDescriptors) {
        modelContext.unregisterTool?.(tool.name);
      }
    },
  };
}
