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

  starterTitle: { id: "Contoh prompt", en: "Prompt example" },
  starterCopy: { id: "Salin contoh", en: "Copy example" },
  starterCopied: { id: "Tersalin", en: "Copied" },
  starterHint: {
    id: "Contoh saja. Bicara ke agent dengan kalimatmu sendiri, urutannya bebas.",
    en: "An example, not a script. Talk to the agent in your own words, in any order.",
  },

  safetyWarning: { id: "Peringatan keselamatan", en: "Safety warning" },
  safetyNote: { id: "Catatan keselamatan", en: "Safety note" },
  dismiss: { id: "Tutup", en: "Dismiss" },

  buildTitle: { id: "Status build", en: "Build status" },
  backendHealth: { id: "Health backend", en: "Backend health" },

  modeWebmcp: { id: "WebMCP", en: "WebMCP" },
  modeManual: { id: "Manual", en: "Manual" },
  modeHintWebmcp: {
    id: "Agent yang mengendalikan lab lewat WebMCP.",
    en: "The agent drives the lab through WebMCP.",
  },
  modeHintManual: {
    id: "Jalankan tool sendiri dari panel kanan, tanpa agent.",
    en: "Run the tools yourself from the right panel, without an agent.",
  },

  navInfo: { id: "Tentang aplikasi", en: "About this lab" },
  navCommands: { id: "Perintah yang didukung", en: "Supported commands" },
  navTools: { id: "Tool terdaftar", en: "Registered tools" },
  navTopics: { id: "Topik dan bahan", en: "Topics and substances" },
  navCredits: { id: "Kredit dan lisensi", en: "Credits and licence" },
  close: { id: "Tutup", en: "Close" },

  aboutBody: {
    id: "Simulator lab kimia dan fisika 3D untuk siswa SMP dan SMA. AI agent berperan sebagai instruktur: dia mengganti topik, menakar bahan, mencampurnya, menjelaskan tahap reaksi, dan menyusun laporan pengamatan. Semua hasil reaksi berasal dari tabel statis, bukan dari model bahasa, supaya sainsnya tidak berhalusinasi.",
    en: "A 3D chemistry and physics lab for secondary school students. An AI agent acts as the instructor: it switches topics, measures reagents, mixes them, explains each step of the reaction, and writes the observation report. Reaction outcomes come from a static table rather than a language model, so the science cannot be hallucinated.",
  },
  aboutHow: {
    id: "Agent memanggil tool lewat WebMCP di browser yang mendukungnya. Kalau browsernya belum, mode Manual di panel atas menjalankan tool yang sama langsung dari halaman ini.",
    en: "The agent calls the tools through WebMCP where the browser supports it. Where it does not, Manual mode in the top bar runs the same tools straight from this page.",
  },
  commandsBody: {
    id: "Contoh berikut menjalankan seluruh demo, tapi bukan mantra. Agent memahami maksud, jadi ucapkan dengan kalimatmu sendiri dan dengan urutan yang kamu mau.",
    en: "The example below runs the whole demo, but it is not an incantation. The agent works from intent, so say it in your own words, in whatever order you like.",
  },
  topicsBody: {
    id: "Tiga topik yang dikunci, beserta bahan yang tersedia di masing-masing.",
    en: "Three locked topics, with the substances available in each.",
  },
  creditsBody: {
    id: "Seluruh model 3D di halaman ini dibuat dari primitif geometris di dalam kode. Tidak ada aset pihak ketiga. Dirilis di bawah lisensi MIT.",
    en: "Every 3D model on this page is built from geometric primitives in code. There are no third party assets. Released under the MIT licence.",
  },
  toolsDisplayNote: {
    id: "Deskripsi yang dibaca agent ditulis dalam Bahasa Inggris. Di bawah ini ringkasannya.",
    en: "The descriptions the agent reads are written in English. These are summaries.",
  },
  labState: { id: "Keadaan lab", en: "Lab state" },
  topic: { id: "Topik", en: "Topic" },
  lamp: { id: "Lampu uji", en: "Test lamp" },
  objectState: { id: "Benda", en: "Object" },
  activity: { id: "Aktivitas agent", en: "Agent activity" },
  noActivity: { id: "Belum ada tool yang dipanggil.", en: "No tool has been called yet." },
} as const;

export type StringKey = keyof typeof STRINGS;

/** What each tool does, for a reader rather than for the agent. */
export const TOOL_SUMMARY: Record<string, { id: string; en: string }> = {
  switch_experiment_mode: {
    id: "Mengganti mata pelajaran dan topik. Alat di atas meja ikut berganti.",
    en: "Switches the subject and topic. The apparatus on the bench changes with it.",
  },
  mix_substances: {
    id: "Menakar tiap bahan di meja, lalu memasukkannya ke gelas kimia satu per satu.",
    en: "Measures each reagent out on the bench, then adds them to the beaker one at a time.",
  },
  explain_reaction_step: {
    id: "Menjelaskan satu tahap reaksi, dari tahap 1 sampai 4.",
    en: "Explains one step of the reaction, from step 1 to step 4.",
  },
  render_lab_report: {
    id: "Menyusun laporan pengamatan dari apa yang terjadi di sesi ini.",
    en: "Writes the observation report from what happened in this session.",
  },
  trigger_safety_alert: {
    id: "Menampilkan catatan keselamatan sebagai bagian dari pelajaran.",
    en: "Shows a safety note as part of the lesson.",
  },
  get_lab_state: {
    id: "Membaca keadaan lab sekarang sebelum memutuskan langkah berikutnya.",
    en: "Reads the current state of the lab before deciding what to do next.",
  },
  reset_experiment: {
    id: "Mengosongkan gelas dan mengulang topik dari awal.",
    en: "Empties the beaker and starts the topic over.",
  },
};

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
 * English by default, since the judges read English and the submission
 * materials are in English. `?lang=id` opens it in Indonesian, which is what a
 * classroom link would use.
 */
export function initialLang(): UiLang {
  if (typeof window === "undefined") return "en";
  const requested = new URLSearchParams(window.location.search)
    .get("lang")
    ?.toLowerCase();
  return requested === "id" ? "id" : "en";
}

/** The prompt a judge can paste into the agent to drive the whole demo. */
export const STARTER_PROMPT = `You are my chemistry lab instructor. This page gives you tools for a 3D lab.

Have a look at what is on the bench, then take me through the acid and base
experiment: mix vinegar with baking soda, tell me what you see, and explain the
reaction step by step. Warn me about anything worth being careful with.

After that I would like to compare salt water with sugar water and see what the
lamp does, and then watch an egg in fresh water and in salt water.

Write up the lab report when we are done. Narrate as you go, in the language I
am using.`;
