export type UiLang = "id" | "en";

/**
 * Interface strings in both languages.
 *
 * The lab is built for Indonesian classrooms, so Indonesian is the default and
 * English is one click away. Tool names and tool descriptions stay in English
 * whatever this is set to: those are read by the agent, not by the student.
 */
const STRINGS = {
  tagline: {
    id: "Lab kimia dan fisika 3D dengan AI agent sebagai instrukturnya, ditenagai WebMCP.",
    en: "A 3D chemistry and physics lab where an AI agent is the lab instructor, powered by WebMCP.",
  },
  badgeChecking: { id: "WebMCP: memeriksa", en: "WebMCP: checking" },
  badgeMissing: { id: "WebMCP: tidak terdeteksi", en: "WebMCP: not detected" },
  badgeReady: { id: "WebMCP: terdeteksi, {count} tool terdaftar", en: "WebMCP: detected, {count} tools registered" },
  badgeTitleReady: { id: "Tool yang terdaftar", en: "Registered tools" },
  badgeTitleMissing: {
    id: "Tool siap didaftarkan, jalankan lewat Manual Tool Runner",
    en: "Tools ready to register, run them from the Manual Tool Runner",
  },

  panelTitle: { id: "Panel pengamatan", en: "Observation panel" },
  panelEmpty: {
    id: "Belum ada isinya. Minta agent menjelaskan tahap reaksi, atau menyusun laporannya.",
    en: "Nothing to show yet. Ask the agent to explain a reaction step, or to write up the experiment.",
  },
  panelStep: { id: "Tahap {step} dari {total}", en: "Step {step} of {total}" },
  volume: { id: "Volume", en: "Volume" },
  temperature: { id: "Suhu", en: "Temperature" },
  inBeaker: { id: "Isi gelas", en: "In the beaker" },
  beakerEmpty: { id: "kosong", en: "empty" },
  observations: { id: "Pengamatan", en: "Observations" },

  sourceStatic: { id: "teks siap pakai, diperiksa manusia", en: "prepared text, checked by a person" },
  sourceCache: { id: "dari cache", en: "from cache" },
  sourceLlm: { id: "ditulis model barusan", en: "written by the model just now" },
  sourceFallback: { id: "teks siap pakai, model tidak tersedia", en: "prepared text, model unavailable" },

  toolsTitle: { id: "Tool yang terdaftar", en: "Registered tools" },
  toolsHint: {
    id: "Minta agent menyebutkan tool yang tersedia. Nama di bawah inilah jawabannya.",
    en: "Ask the agent to list its available tools. The names below are what it should answer with.",
  },

  runnerTitle: { id: "Manual Tool Runner", en: "Manual tool runner" },
  runnerHint: {
    id: "Jalankan tool langsung dari halaman ini, tanpa agent. Berguna kalau browsernya belum mendukung WebMCP.",
    en: "Run a tool straight from this page, without an agent. Useful when the browser does not support WebMCP yet.",
  },
  runnerArguments: { id: "Argumen (JSON)", en: "Arguments (JSON)" },
  runnerRun: { id: "Jalankan", en: "Run" },
  runnerRunning: { id: "Menjalankan", en: "Running" },
  runnerResult: { id: "Hasil", en: "Result" },
  runnerInvalidJson: { id: "Argumen bukan JSON yang sah.", en: "The arguments are not valid JSON." },

  starterTitle: { id: "Prompt awal untuk agent", en: "Starter prompt for the agent" },
  starterCopy: { id: "Salin prompt awal", en: "Copy starter prompt" },
  starterCopied: { id: "Tersalin", en: "Copied" },

  safetyWarning: { id: "Peringatan keselamatan", en: "Safety warning" },
  safetyNote: { id: "Catatan keselamatan", en: "Safety note" },
  dismiss: { id: "Tutup", en: "Dismiss" },

  buildTitle: { id: "Status build", en: "Build status" },
  backendHealth: { id: "Health backend", en: "Backend health" },
} as const;

export type StringKey = keyof typeof STRINGS;

export function t(
  lang: UiLang,
  key: StringKey,
  values?: Record<string, string | number>,
): string {
  let text: string = STRINGS[key][lang];
  if (values) {
    for (const [name, value] of Object.entries(values)) {
      text = text.replace(`{${name}}`, String(value));
    }
  }
  return text;
}

/**
 * Language to start in.
 *
 * Indonesian unless the URL asks for English, which is what the testing
 * instructions hand to the judges.
 */
export function initialLang(): UiLang {
  if (typeof window === "undefined") return "id";
  const requested = new URLSearchParams(window.location.search)
    .get("lang")
    ?.toLowerCase();
  return requested === "en" ? "en" : "id";
}

/** The prompt a judge can paste into the agent to drive the whole demo. */
export const STARTER_PROMPT = `You are my chemistry lab instructor. This page gives you seven tools.

1. Call get_lab_state to see what is on the bench.
2. Switch to the acid and base topic, then mix cuka with baking_soda, 150 ml.
3. Tell me what you observe, then explain the reaction step by step from step 1 to step 4.
4. Raise a safety alert about why this reaction is done in an open beaker.
5. Switch to the electrolyte topic and compare salt water against sugar water, and tell me what the lamp does in each case.
6. Switch to the density topic and show me an egg in fresh water, then in salt water.
7. Finish by writing the lab report.

Narrate what you are doing as you go, in the language I am using.`;
