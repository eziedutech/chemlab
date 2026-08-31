"use client";

import { t, type StringKey, type UiLang } from "../../lib/i18n";
import { useLabStore } from "../../store/labStore";

/** How the text was produced, said plainly rather than hidden. */
const SOURCE_KEY: Record<string, StringKey> = {
  static: "sourceStatic",
  cache: "sourceCache",
  llm: "sourceLlm",
  fallback: "sourceFallback",
};

function sourceLabel(lang: UiLang, source: string): string {
  const key = SOURCE_KEY[source];
  return key ? t(lang, key) : source;
}

/**
 * Where step explanations and the finished lab report are shown, with the log
 * the lab itself recorded underneath, so what the agent says and what actually
 * happened can be compared side by side.
 */
export function ObservationPanel() {
  const panel = useLabStore((state) => state.panel);
  const observationLog = useLabStore((state) => state.observationLog);
  const uiLang = useLabStore((state) => state.uiLang);

  return (
    <section className="glass-panel p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium tracking-wide text-slate-200">
          {t(uiLang, "panelTitle")}
        </h2>
        {panel && (
          <span className="text-xs text-slate-400">
            {sourceLabel(uiLang, panel.source)}
          </span>
        )}
      </div>

      {panel ? (
        <article className="mt-4">
          <h3 className="text-sm font-medium text-slate-100">
            {panel.stepNumber && panel.totalSteps
              ? `${t(uiLang, "panelStep", {
                  step: panel.stepNumber,
                  total: panel.totalSteps,
                })}: ${panel.title}`
              : panel.title}
          </h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-300">
            {panel.body}
          </p>
          {panel.points.length > 0 && (
            <ul className="mt-4 space-y-1.5 border-t border-white/[0.07] pt-4 text-sm text-slate-400">
              {panel.points.map((point) => (
                <li key={point} className="flex gap-2">
                  <span className="text-slate-500">-</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          {t(uiLang, "panelEmpty")}
        </p>
      )}

      {observationLog.length > 0 && (
        <div className="mt-5 border-t border-white/[0.07] pt-4">
          <h3 className="text-xs uppercase tracking-wider text-slate-400">
            {t(uiLang, "observations")}
          </h3>
          <ol className="mt-2 space-y-2 text-sm text-slate-400">
            {observationLog.map((entry, index) => (
              <li key={`${index}-${entry.id.slice(0, 24)}`} className="flex gap-3">
                <span className="font-mono text-xs text-slate-500">{index + 1}</span>
                <span>{uiLang === "id" ? entry.id : entry.en}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
