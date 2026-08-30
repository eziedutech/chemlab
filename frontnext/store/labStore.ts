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

export const EMPTY_BEAKER: BeakerState = {
  substances: [],
  color: "#dfe8ff",
  volumeMl: 0,
  bubbles: false,
  precipitate: false,
};

interface LabState {
  activeSubject: Subject;
  activeTopic: Topic;
  beaker: BeakerState;
  temperatureC: number;
  observationLog: string[];
  safetyAlert: SafetyAlert | null;
  agentActivity: AgentActivity[];
  webmcp: WebMcpStatus;

  /** Called on the first line of every tool execute, so the toast is proof of a real call. */
  pushAgentActivity: (toolName: string) => void;
  dropAgentActivity: (id: number) => void;
  setWebmcpStatus: (status: WebMcpStatus) => void;
  setActiveExperiment: (subject: Subject, topic: Topic) => void;
  setSafetyAlert: (alert: SafetyAlert | null) => void;
  appendObservation: (entry: string) => void;
  resetExperiment: (keepObservationLog?: boolean) => void;
}

let activityCounter = 0;

export const useLabStore = create<LabState>((set) => ({
  activeSubject: "kimia",
  activeTopic: "asam_basa",
  beaker: EMPTY_BEAKER,
  temperatureC: 25,
  observationLog: [],
  safetyAlert: null,
  agentActivity: [],
  webmcp: { detected: false, toolCount: 0, checked: false },

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
    }),

  setSafetyAlert: (alert) => set({ safetyAlert: alert }),

  appendObservation: (entry) =>
    set((state) => ({ observationLog: [...state.observationLog, entry] })),

  resetExperiment: (keepObservationLog = false) =>
    set((state) => ({
      beaker: EMPTY_BEAKER,
      temperatureC: 25,
      safetyAlert: null,
      observationLog: keepObservationLog ? state.observationLog : [],
    })),
}));
