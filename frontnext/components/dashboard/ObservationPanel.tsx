"use client";

import { useLabStore } from "../../store/labStore";

/** How the text was produced, said plainly rather than hidden. */
const SOURCE_LABEL: Record<string, string> = {
  static: "prepared text, checked by a person",
  cache: "from cache",
  llm: "written by the model just now",
  fallback: "prepared text, model unavailable",
  offline: "offline",
};

/**
 * Where step explanations and the finished lab report are shown.
 *
 * The observation log sits underneath, so what the agent says and what the lab
 * actually recorded can be compared side by side.
 */
export function ObservationPanel() {
  const panel = useLabStore((state) => state.panel);
  const observationLog = useLabStore((state) => state.observationLog);
  const temperature = useLabStore((state) => state.temperatureC);
  const beaker = useLabStore((state) => state.beaker);

  return (
    <section className="glass-panel p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium tracking-wide text-slate-200">
          Observation panel
        </h2>
        {panel && (
          <span className="text-xs text-slate-500">
            {SOURCE_LABEL[panel.source] ?? panel.source}
          </span>
        )}
      </div>

      {panel ? (
        <article className="mt-4">
          <h3 className="text-base font-medium text-slate-100">
            {panel.stepNumber && panel.totalSteps
              ? `Step ${panel.stepNumber} of ${panel.totalSteps}: ${panel.title}`
              : panel.title}
          </h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-300">
            {panel.body}
          </p>
          {panel.points.length > 0 && (
            <ul className="mt-4 space-y-1.5 border-t border-white/[0.07] pt-4 text-sm text-slate-400">
              {panel.points.map((point) => (
                <li key={point} className="flex gap-2">
                  <span className="text-slate-600">-</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      ) : (
        <p className="mt-3 text-sm text-slate-400">
          Nothing to show yet. Ask the agent to explain a reaction step, or to
          write up the experiment.
        </p>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-white/[0.07] pt-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-slate-500">Volume</dt>
          <dd className="font-mono text-slate-200">
            {Math.round(beaker.volumeMl)} mL
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Temperature</dt>
          <dd className="font-mono text-slate-200">{temperature} C</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">In the beaker</dt>
          <dd className="text-slate-200">
            {beaker.substances.length > 0 ? beaker.substances.join(", ") : "empty"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Observations</dt>
          <dd className="font-mono text-slate-200">{observationLog.length}</dd>
        </div>
      </dl>

      {observationLog.length > 0 && (
        <ol className="mt-4 space-y-2 text-sm text-slate-400">
          {observationLog.map((entry, index) => (
            <li key={`${index}-${entry.slice(0, 24)}`} className="flex gap-3">
              <span className="font-mono text-xs text-slate-600">
                {index + 1}
              </span>
              <span>{entry}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
