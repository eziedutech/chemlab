import type { ToolDescriptor, ToolResult } from "../getModelContext";
import { TOPIC_SUBSTANCES } from "../../reactions/reactionDefinitions";
import { useLabStore } from "../../../store/labStore";

export const getLabState: ToolDescriptor = {
  name: "get_lab_state",
  description:
    "Read the current lab state: active topic, what is in the beaker, liquid colour, temperature, and the observation log so far. Call this before deciding on the next step.",
  inputSchema: { type: "object", properties: {} },
  execute: async (): Promise<ToolResult> => {
    useLabStore.getState().pushAgentActivity("get_lab_state");

    const state = useLabStore.getState();
    return {
      success: true,
      active_subject: state.activeSubject,
      active_topic: state.activeTopic,
      beaker: {
        substances: state.beaker.substances,
        color: state.beaker.color,
        volume_ml: state.beaker.volumeMl,
        bubbles: state.beaker.bubbles,
        precipitate: state.beaker.precipitate,
      },
      temperature_c: state.temperatureC,
      lamp_brightness: state.lampBrightness,
      object_state: state.objectState,
      /**
       * True while the scene is still carrying out a mix the agent asked for,
       * which covers measuring the reagents out as well as adding them.
       */
      busy:
        state.pourQueue.length > 0 ||
        (state.mix !== null && state.mix.stage !== "done"),
      mix_stage: state.mix ? state.mix.stage : null,
      observation_log: state.observationLog,
      safety_alert: state.safetyAlert,
      available_substances: TOPIC_SUBSTANCES[state.activeTopic],
    };
  },
};
