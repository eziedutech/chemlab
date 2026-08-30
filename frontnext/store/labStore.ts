import { create } from "zustand";

export type Subject = "kimia" | "fisika";
export type Topic = "asam_basa" | "elektrolit" | "massa_jenis";
export type Severity = "info" | "warning";

export interface BeakerState {
  substances: string[];
  color: string;
  volumeMl: number;
  bubbles: boolean;
  precipitate: boolean;
}

export interface AgentActivity {
  /** Monotonic id, used as the React key and by the auto dismiss timer. */
  id: number;
  toolName: string;
  at: number;
}

export interface SafetyAlert {
  reason: string;
  severity: Severity;
}

export interface WebMcpStatus {
  /** False until registration has actually run in the browser. */
  detected: boolean;
  toolCount: number;
  checked: boolean;
}

/**
 * One reagent to be lifted, carried over the beaker, and poured in.
 *
 * The queue is what makes an agent call look like an experiment rather than a
 * value assignment: the scene works through it one bottle at a time, and the
 * beaker only changes when a bottle is actually tipped over it.
 */
export interface PourJob {
  id: number;
  substance: string;
  /**
   * How the substance gets into the beaker: poured from a bottle, or lowered
   * in as an object. Each is animated by a different actor in the scene, and
   * both work through this one queue so the order stays right.
   */
  kind: "pour" | "drop";
  /** Colour of the reagent itself, used for the bottle and the stream. */
  color: string;
  /** Beaker contents once this pour has landed. */
  resultColor: string;
  resultVolumeMl: number;
  resultBubbles: boolean;
  resultPrecipitate: boolean;
  /**
   * Everything that is not the liquid itself: temperature, the electrolyte
   * lamp, whether the egg floats. Carried on the pour that causes it, so the
   * lamp does not light before the liquid has arrived.
   */
  outcome?: {
    temperatureC?: number;
    lampBrightness?: number;
    objectState?: "floats" | "sinks" | null;
  };
}

export const EMPTY_BEAKER: BeakerState = {
  substances: [],
  color: "#dfe8ff",
  volumeMl: 0,
  bubbles: false,
  precipitate: false,
};

/** How long one reagent takes: lift, carry, tip, pour, and set back down. */
export const POUR_DURATION_MS = 3200;

interface LabState {
  activeSubject: Subject;
  activeTopic: Topic;
  beaker: BeakerState;
  temperatureC: number;
  observationLog: string[];
  safetyAlert: SafetyAlert | null;
  agentActivity: AgentActivity[];
  webmcp: WebMcpStatus;
  /** Electrolyte topic: how brightly the test lamp glows, 0 to 1. */
  lampBrightness: number;
  /** Density topic: what the egg is doing. */
  objectState: "floats" | "sinks" | null;
  pourQueue: PourJob[];

  /** Called on the first line of every tool execute, so the toast is proof of a real call. */
  pushAgentActivity: (toolName: string) => void;
  dropAgentActivity: (id: number) => void;
  setWebmcpStatus: (status: WebMcpStatus) => void;
  setActiveExperiment: (subject: Subject, topic: Topic) => void;
  setSafetyAlert: (alert: SafetyAlert | null) => void;
  appendObservation: (entry: string) => void;
  resetExperiment: (keepObservationLog?: boolean) => void;

  enqueuePours: (jobs: Omit<PourJob, "id">[]) => number[];
  /** Called by the scene at the moment a bottle actually tips over the beaker. */
  applyPour: (id: number) => void;
  /** Called by the scene once a bottle has been set back down. */
  completePour: (id: number) => void;
  setReactionOutcome: (outcome: {
    temperatureC?: number;
    lampBrightness?: number;
    objectState?: "floats" | "sinks" | null;
  }) => void;
}

let activityCounter = 0;
let pourCounter = 0;

export const useLabStore = create<LabState>((set) => ({
  activeSubject: "kimia",
  activeTopic: "asam_basa",
  beaker: EMPTY_BEAKER,
  temperatureC: 25,
  observationLog: [],
  safetyAlert: null,
  agentActivity: [],
  webmcp: { detected: false, toolCount: 0, checked: false },
  lampBrightness: 0,
  objectState: null,
  pourQueue: [],

  pushAgentActivity: (toolName) =>
    set((state) => ({
      agentActivity: [
        ...state.agentActivity,
        { id: ++activityCounter, toolName, at: Date.now() },
      ].slice(-4),
    })),

  dropAgentActivity: (id) =>
    set((state) => ({
      agentActivity: state.agentActivity.filter((item) => item.id !== id),
    })),

  setWebmcpStatus: (status) => set({ webmcp: status }),

  setActiveExperiment: (subject, topic) =>
    set({
      activeSubject: subject,
      activeTopic: topic,
      beaker: EMPTY_BEAKER,
      temperatureC: 25,
      safetyAlert: null,
      lampBrightness: 0,
      objectState: null,
      pourQueue: [],
    }),

  setSafetyAlert: (alert) => set({ safetyAlert: alert }),

  appendObservation: (entry) =>
    set((state) => ({ observationLog: [...state.observationLog, entry] })),

  resetExperiment: (keepObservationLog = false) =>
    set((state) => ({
      beaker: EMPTY_BEAKER,
      temperatureC: 25,
      safetyAlert: null,
      lampBrightness: 0,
      objectState: null,
      pourQueue: [],
      observationLog: keepObservationLog ? state.observationLog : [],
    })),

  enqueuePours: (jobs) => {
    const withIds = jobs.map((job) => ({ ...job, id: ++pourCounter }));
    set((state) => ({ pourQueue: [...state.pourQueue, ...withIds] }));
    return withIds.map((job) => job.id);
  },

  applyPour: (id) =>
    set((state) => {
      const job = state.pourQueue.find((item) => item.id === id);
      if (!job) return {};
      return {
        temperatureC: job.outcome?.temperatureC ?? state.temperatureC,
        lampBrightness: job.outcome?.lampBrightness ?? state.lampBrightness,
        objectState:
          job.outcome?.objectState === undefined
            ? state.objectState
            : job.outcome.objectState,
        beaker: {
          substances: state.beaker.substances.includes(job.substance)
            ? state.beaker.substances
            : [...state.beaker.substances, job.substance],
          color: job.resultColor,
          volumeMl: job.resultVolumeMl,
          bubbles: job.resultBubbles,
          precipitate: job.resultPrecipitate,
        },
      };
    }),

  completePour: (id) =>
    set((state) => ({
      pourQueue: state.pourQueue.filter((item) => item.id !== id),
    })),

  setReactionOutcome: ({ temperatureC, lampBrightness, objectState }) =>
    set((state) => ({
      temperatureC: temperatureC ?? state.temperatureC,
      lampBrightness: lampBrightness ?? state.lampBrightness,
      objectState: objectState === undefined ? state.objectState : objectState,
    })),
}));
