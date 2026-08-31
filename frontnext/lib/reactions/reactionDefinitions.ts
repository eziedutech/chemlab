import type { Topic } from "../../store/labStore";

/**
 * Static reaction data.
 *
 * Outcomes are looked up here and never produced by a language model, so the
 * science stays correct and the same request always gives the same result. The
 * model only ever writes the narration around these facts.
 */

export type TemperatureDirection = "endoterm" | "eksoterm" | "netral";

export interface SubstanceDefinition {
  /** Colour the substance shows while it is being poured. */
  color: string;
  /** Chemical formula, or an empty string where there is not one. */
  formula: string;
  /**
   * Whether the scene pours this from a bottle or lowers it in as an object.
   * An egg does not come out of a reagent bottle.
   */
  kind: "liquid" | "powder" | "object";
  labelId: string;
  labelEn: string;
  /** Spellings an agent is likely to type for this substance. */
  aliases: string[];
}

export interface ReactionDefinition {
  id: string;
  topic: Topic;
  resultColor: string;
  hasBubbles: boolean;
  hasPrecipitate: boolean;
  temperatureChange: TemperatureDirection;
  deltaC: number;
  /** Electrolyte topic: how brightly the test lamp glows, 0 to 1. */
  lampBrightness?: number;
  /** Density topic: what the egg does once the liquid is ready. */
  objectState?: "floats" | "sinks";
  explanationKey: string;
  observationId: string;
  observationEn: string;
}

export const SUBSTANCES: Record<string, SubstanceDefinition> = {
  air: {
    color: "#cfe0ee",
    formula: "H₂O",
    kind: "liquid",
    labelId: "Air",
    labelEn: "Water",
    aliases: ["water", "air_tawar", "air_keran", "fresh_water", "plain_water"],
  },
  air_suling: {
    color: "#e2eef7",
    formula: "H₂O",
    kind: "liquid",
    labelId: "Air suling",
    labelEn: "Distilled water",
    aliases: ["aquades", "akuades", "distilled_water", "aquadest"],
  },
  air_garam: {
    color: "#c3d9ea",
    formula: "NaCl (aq)",
    kind: "liquid",
    labelId: "Air garam",
    labelEn: "Salt water",
    aliases: ["larutan_garam", "salt_water", "brine", "air_asin"],
  },
  cuka: {
    color: "#f0e4bf",
    formula: "CH₃COOH",
    kind: "liquid",
    labelId: "Cuka",
    labelEn: "Vinegar",
    aliases: ["vinegar", "asam_cuka", "cuka_dapur", "asam_asetat", "acetic_acid"],
  },
  baking_soda: {
    color: "#f3f6f9",
    formula: "NaHCO₃",
    kind: "powder",
    labelId: "Baking soda",
    labelEn: "Baking soda",
    aliases: [
      "soda_kue",
      "natrium_bikarbonat",
      "sodium_bicarbonate",
      "nahco3",
      "bicarbonate",
    ],
  },
  garam: {
    color: "#f2f5f8",
    formula: "NaCl",
    kind: "powder",
    labelId: "Garam",
    labelEn: "Salt",
    aliases: ["salt", "nacl", "garam_dapur", "table_salt"],
  },
  gula: {
    color: "#f6f1e4",
    formula: "C₁₂H₂₂O₁₁",
    kind: "powder",
    labelId: "Gula",
    labelEn: "Sugar",
    aliases: ["sugar", "sukrosa", "sucrose", "gula_pasir"],
  },
  lakmus: {
    color: "#b9a7d8",
    formula: "",
    kind: "powder",
    labelId: "Lakmus",
    labelEn: "Litmus",
    aliases: ["litmus", "kertas_lakmus", "litmus_paper", "indikator_lakmus"],
  },
  pp: {
    color: "#f4f0f7",
    formula: "C₂₀H₁₄O₄",
    kind: "liquid",
    labelId: "Indikator PP",
    labelEn: "Phenolphthalein",
    aliases: ["fenolftalein", "phenolphthalein", "indikator_pp", "pp_indicator"],
  },
  telur: {
    color: "#f0e2cc",
    formula: "",
    kind: "object",
    labelId: "Telur",
    labelEn: "Egg",
    aliases: ["egg", "telur_ayam", "chicken_egg"],
  },
};

/** Pair key, order independent: the two names sorted and joined. */
function pairKey(a: string, b: string): string {
  return [a, b].sort().join("+");
}

function entry(
  topic: Topic,
  a: string,
  b: string,
  definition: Omit<ReactionDefinition, "topic">,
): [string, ReactionDefinition] {
  return [`${topic}:${pairKey(a, b)}`, { ...definition, topic }];
}

/**
 * Keyed by topic as well as by pair, because the same pair means different
 * things in different lessons: water and salt is the strong electrolyte demo in
 * one topic and the way to build a denser liquid in another.
 */
export const REACTIONS: Record<string, ReactionDefinition> = Object.fromEntries([
  // --- Topic: acids and bases -------------------------------------------
  entry("asam_basa", "cuka", "baking_soda", {
    id: "acid_base_co2",
    resultColor: "#e8f4d4",
    hasBubbles: true,
    hasPrecipitate: false,
    temperatureChange: "endoterm",
    deltaC: -3,
    explanationKey: "acid_base_co2",
    observationId:
      "Larutan berbuih kuat, gelembung gas naik ke permukaan, dan dinding gelas terasa lebih dingin.",
    observationEn:
      "The solution fizzes vigorously, gas bubbles rise to the surface, and the beaker wall feels colder.",
  }),
  entry("asam_basa", "cuka", "lakmus", {
    id: "acid_litmus_red",
    resultColor: "#e0736a",
    hasBubbles: false,
    hasPrecipitate: false,
    temperatureChange: "netral",
    deltaC: 0,
    explanationKey: "acid_litmus_red",
    observationId: "Lakmus berubah menjadi merah, menandakan larutan bersifat asam.",
    observationEn: "The litmus turns red, showing the solution is acidic.",
  }),
  entry("asam_basa", "baking_soda", "air", {
    id: "base_dissolves",
    resultColor: "#dfe9f4",
    hasBubbles: false,
    hasPrecipitate: false,
    temperatureChange: "endoterm",
    deltaC: -1,
    explanationKey: "base_dissolves",
    observationId:
      "Serbuk larut perlahan dan larutan tetap bening, sedikit lebih dingin dari sebelumnya.",
    observationEn:
      "The powder dissolves slowly, the solution stays clear, and it turns slightly colder.",
  }),
  entry("asam_basa", "air", "lakmus", {
    id: "neutral_litmus",
    resultColor: "#a99bd0",
    hasBubbles: false,
    hasPrecipitate: false,
    temperatureChange: "netral",
    deltaC: 0,
    explanationKey: "neutral_litmus",
    observationId: "Lakmus tetap ungu, larutan bersifat netral.",
    observationEn: "The litmus stays purple, so the solution is neutral.",
  }),
  entry("asam_basa", "baking_soda", "pp", {
    id: "base_pp_pink",
    resultColor: "#ef9ac5",
    hasBubbles: false,
    hasPrecipitate: false,
    temperatureChange: "netral",
    deltaC: 0,
    explanationKey: "base_pp_pink",
    observationId:
      "Indikator PP berubah merah muda, menandakan larutan bersifat basa.",
    observationEn: "Phenolphthalein turns pink, showing the solution is basic.",
  }),
  entry("asam_basa", "cuka", "pp", {
    id: "acid_pp_clear",
    resultColor: "#eef2f7",
    hasBubbles: false,
    hasPrecipitate: false,
    temperatureChange: "netral",
    deltaC: 0,
    explanationKey: "acid_pp_clear",
    observationId:
      "Indikator PP tetap tidak berwarna, karena PP hanya berubah warna pada suasana basa.",
    observationEn:
      "Phenolphthalein stays colourless, because it only changes colour in basic conditions.",
  }),

  // --- Topic: electrolytes ----------------------------------------------
  entry("elektrolit", "air", "garam", {
    id: "strong_electrolyte",
    resultColor: "#cfe2f2",
    hasBubbles: false,
    hasPrecipitate: false,
    temperatureChange: "netral",
    deltaC: 0,
    lampBrightness: 1,
    explanationKey: "strong_electrolyte",
    observationId:
      "Lampu menyala terang. Garam terurai menjadi ion yang bebas bergerak, sehingga larutan menghantarkan listrik dengan baik.",
    observationEn:
      "The lamp glows brightly. The salt splits into free moving ions, so the solution conducts electricity well.",
  }),
  entry("elektrolit", "air", "gula", {
    id: "non_electrolyte",
    resultColor: "#e7e0d2",
    hasBubbles: false,
    hasPrecipitate: false,
    temperatureChange: "netral",
    deltaC: 0,
    lampBrightness: 0,
    explanationKey: "non_electrolyte",
    observationId:
      "Lampu tidak menyala. Gula larut sebagai molekul utuh, tidak menghasilkan ion, sehingga larutan tidak menghantarkan listrik.",
    observationEn:
      "The lamp stays off. Sugar dissolves as whole molecules and produces no ions, so the solution does not conduct.",
  }),
  entry("elektrolit", "air", "cuka", {
    id: "weak_electrolyte",
    resultColor: "#eee9d3",
    hasBubbles: false,
    hasPrecipitate: false,
    temperatureChange: "netral",
    deltaC: 0,
    lampBrightness: 0.35,
    explanationKey: "weak_electrolyte",
    observationId:
      "Lampu menyala redup. Cuka hanya terionisasi sebagian, jadi ionnya sedikit dan hantarannya lemah.",
    observationEn:
      "The lamp glows dimly. Vinegar only ionises partially, so there are few ions and conduction is weak.",
  }),
  entry("elektrolit", "air_suling", "garam", {
    id: "strong_electrolyte_distilled",
    resultColor: "#cfe2f2",
    hasBubbles: false,
    hasPrecipitate: false,
    temperatureChange: "netral",
    deltaC: 0,
    lampBrightness: 1,
    explanationKey: "strong_electrolyte",
    observationId:
      "Lampu menyala terang. Air suling sendiri hampir tidak menghantarkan listrik, jadi hantaran ini datang dari ion garam.",
    observationEn:
      "The lamp glows brightly. Distilled water on its own barely conducts, so the conduction comes from the salt ions.",
  }),

  // --- Topic: density and Archimedes ------------------------------------
  entry("massa_jenis", "air", "garam", {
    id: "salt_water_formed",
    resultColor: "#c3d9ea",
    hasBubbles: false,
    hasPrecipitate: false,
    temperatureChange: "netral",
    deltaC: 0,
    explanationKey: "salt_water_formed",
    observationId:
      "Garam larut dan larutan menjadi lebih rapat daripada air biasa. Massa jenisnya kini di atas 1 g/cm3.",
    observationEn:
      "The salt dissolves and the liquid becomes denser than plain water. Its density is now above 1 g/cm3.",
  }),
  entry("massa_jenis", "air", "telur", {
    id: "egg_sinks",
    resultColor: "#cfe0ee",
    hasBubbles: false,
    hasPrecipitate: false,
    temperatureChange: "netral",
    deltaC: 0,
    objectState: "sinks",
    explanationKey: "egg_sinks",
    observationId:
      "Telur tenggelam. Massa jenis telur lebih besar daripada air tawar, sehingga gaya apung tidak cukup menahannya.",
    observationEn:
      "The egg sinks. It is denser than fresh water, so the buoyant force is not enough to hold it up.",
  }),
  entry("massa_jenis", "air_garam", "telur", {
    id: "egg_floats",
    resultColor: "#c3d9ea",
    hasBubbles: false,
    hasPrecipitate: false,
    temperatureChange: "netral",
    deltaC: 0,
    objectState: "floats",
    explanationKey: "egg_floats",
    observationId:
      "Telur mengapung. Air garam lebih rapat daripada telur, sehingga gaya apungnya melebihi berat telur.",
    observationEn:
      "The egg floats. The salt water is denser than the egg, so the buoyant force exceeds its weight.",
  }),
]);

/** Substances offered per topic, in the order a lesson would use them. */
export const TOPIC_SUBSTANCES: Record<Topic, string[]> = {
  asam_basa: ["cuka", "baking_soda", "air", "lakmus", "pp"],
  elektrolit: ["air", "air_suling", "garam", "gula", "cuka"],
  massa_jenis: ["air", "air_garam", "garam", "telur"],
};

const ALIAS_LOOKUP: Record<string, string> = (() => {
  const table: Record<string, string> = {};
  for (const [canonical, definition] of Object.entries(SUBSTANCES)) {
    table[canonical] = canonical;
    for (const alias of definition.aliases) table[alias] = canonical;
  }
  return table;
})();

/**
 * Fold whatever the agent typed onto a canonical substance name.
 *
 * Agents write "Baking Soda", "baking-soda" and "soda kue" for the same thing,
 * so case, surrounding space, and the choice of space or hyphen are all
 * flattened before the alias table is consulted.
 */
export function normalizeSubstance(raw: string): string | null {
  if (typeof raw !== "string") return null;
  const normalized = raw
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  if (!normalized) return null;
  return ALIAS_LOOKUP[normalized] ?? null;
}

/** Look up a reaction for the active topic. Order of the two names is free. */
export function findReaction(
  topic: Topic,
  a: string,
  b: string,
): ReactionDefinition | null {
  return REACTIONS[`${topic}:${pairKey(a, b)}`] ?? null;
}

/** Pairs that do work in this topic, for the failure message. */
export function availablePairs(topic: Topic): string[] {
  return pairsFor(topic).map(([a, b]) => `${a} + ${b}`);
}

/** The same pairs, as the two canonical substance names. */
export function pairsFor(topic: Topic): [string, string][] {
  return Object.entries(REACTIONS)
    .filter(([key]) => key.startsWith(`${topic}:`))
    .map(([key]) => key.slice(topic.length + 1).split("+") as [string, string]);
}

/** Substance name in the reader's language, falling back to the key. */
export function substanceLabel(name: string, lang: "id" | "en"): string {
  const definition = SUBSTANCES[name];
  if (!definition) return name;
  return lang === "id" ? definition.labelId : definition.labelEn;
}

export function substanceFormula(name: string): string {
  return SUBSTANCES[name]?.formula ?? "";
}

export function substanceKind(name: string): SubstanceDefinition["kind"] {
  return SUBSTANCES[name]?.kind ?? "liquid";
}

export function substanceColor(name: string): string {
  return SUBSTANCES[name]?.color ?? "#dfe8ff";
}
