import { getModelContext, type ToolDescriptor } from "./getModelContext";
import { switchExperimentMode } from "./tools/switchExperimentMode";
import { mixSubstances } from "./tools/mixSubstances";
import { explainReactionStep } from "./tools/explainReactionStep";
import { renderLabReport } from "./tools/renderLabReport";
import { triggerSafetyAlert } from "./tools/triggerSafetyAlert";
import { getLabState } from "./tools/getLabState";
import { resetExperiment } from "./tools/resetExperiment";

/** The seven tools the agent drives the lab with. */
export const toolDescriptors: ToolDescriptor[] = [
  switchExperimentMode,
  mixSubstances,
  explainReactionStep,
  renderLabReport,
  triggerSafetyAlert,
  getLabState,
  resetExperiment,
];

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
