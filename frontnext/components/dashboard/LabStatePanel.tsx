"use client";

import { t } from "../../lib/i18n";
import { useLabStore } from "../../store/labStore";

const TOPIC_LABEL: Record<string, { id: string; en: string }> = {
  asam_basa: { id: "Asam dan basa", en: "Acids and bases" },
  elektrolit: { id: "Larutan elektrolit", en: "Electrolyte solutions" },
  massa_jenis: { id: "Massa jenis", en: "Density" },
};

/**
 * What the lab holds right now, in the same terms get_lab_state reports to the
 * agent, so a viewer can check the agent's narration against the instruments.
 */
export function LabStatePanel() {
  const uiLang = useLabStore((state) => state.uiLang);
  const topic = useLabStore((state) => state.activeTopic);
  const beaker = useLabStore((state) => state.beaker);
  const temperature = useLabStore((state) => state.temperatureC);
  const lamp = useLabStore((state) => state.lampBrightness);
  const objectState = useLabStore((state) => state.objectState);

  const rows: [string, string][] = [
    [t(uiLang, "topic"), TOPIC_LABEL[topic]?.[uiLang] ?? topic],
    [t(uiLang, "volume"), `${Math.round(beaker.volumeMl)} mL`],
    [t(uiLang, "temperature"), `${temperature} C`],
    [
      t(uiLang, "inBeaker"),
      beaker.substances.length > 0
        ? beaker.substances.join(", ")
        : t(uiLang, "beakerEmpty"),
    ],
  ];

  if (topic === "elektrolit") {
    rows.push([t(uiLang, "lamp"), `${Math.round(lamp * 100)}%`]);
  }
  if (topic === "massa_jenis" && objectState) {
    rows.push([t(uiLang, "objectState"), objectState]);
  }

  return (
    <section className="glass-panel p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium tracking-wide text-slate-200">
          {t(uiLang, "labState")}
        </h2>
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: beaker.volumeMl > 0 ? beaker.color : "#475569" }}
          aria-hidden="true"
        />
      </div>
      <dl className="mt-4 space-y-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4">
            <dt className="text-slate-400">{label}</dt>
            <dd className="text-right font-mono text-slate-200">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
