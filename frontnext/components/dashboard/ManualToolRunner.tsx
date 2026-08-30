"use client";

import { useMemo, useState } from "react";
import { t } from "../../lib/i18n";
import { toolDescriptors } from "../../lib/webmcp/registerTools";
import { useLabStore } from "../../store/labStore";

/** A sensible starting argument set for each tool, so the box is never blank. */
const SAMPLE_ARGS: Record<string, unknown> = {
  switch_experiment_mode: { subject: "kimia", topic: "asam_basa" },
  mix_substances: { substance_a: "cuka", substance_b: "baking_soda", amount_ml: 150 },
  explain_reaction_step: { step_number: 1 },
  render_lab_report: {
    observations: "The solution fizzed and the beaker felt colder.",
    conclusion: "An acid and a base produce carbon dioxide gas.",
  },
  trigger_safety_alert: { reason: "Keep the beaker open so the gas can escape.", severity: "info" },
  get_lab_state: {},
  reset_experiment: { keep_observation_log: false },
};

/**
 * Runs a tool by hand, exactly as an agent would.
 *
 * This is the way in when the browser has no WebMCP support: the same
 * descriptors, the same execute functions, the same structured results. It also
 * lets anyone see what a tool actually returns, rather than taking the demo's
 * word for it.
 */
export function ManualToolRunner() {
  const uiLang = useLabStore((state) => state.uiLang);
  const detected = useLabStore((state) => state.webmcp.detected);

  const [selected, setSelected] = useState(toolDescriptors[0].name);
  const [args, setArgs] = useState(() =>
    JSON.stringify(SAMPLE_ARGS[toolDescriptors[0].name] ?? {}, null, 2),
  );
  const [result, setResult] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const tool = useMemo(
    () => toolDescriptors.find((entry) => entry.name === selected),
    [selected],
  );

  const onSelect = (name: string) => {
    setSelected(name);
    setArgs(JSON.stringify(SAMPLE_ARGS[name] ?? {}, null, 2));
    setResult(null);
  };

  const run = async () => {
    if (!tool) return;

    let parsed: unknown;
    try {
      parsed = args.trim() ? JSON.parse(args) : {};
    } catch {
      setResult(t(uiLang, "runnerInvalidJson"));
      return;
    }

    setRunning(true);
    try {
      // Label the toast honestly: this call came from the page, not an agent.
      useLabStore.getState().markNextCallManual();
      const value = await tool.execute(parsed);
      setResult(JSON.stringify(value, null, 2));
    } catch (error) {
      setResult(String(error));
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="glass-panel p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium tracking-wide text-slate-200">
          {t(uiLang, "runnerTitle")}
        </h2>
        {!detected && (
          <span className="text-xs text-amber-300/90">
            {t(uiLang, "badgeMissing")}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-sm text-slate-400">{t(uiLang, "runnerHint")}</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <label className="flex-1">
          <span className="sr-only">{t(uiLang, "toolsTitle")}</span>
          <select
            value={selected}
            onChange={(event) => onSelect(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:border-lab-accent/60"
          >
            {toolDescriptors.map((entry) => (
              <option key={entry.name} value={entry.name}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="glass rounded-lg px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10 disabled:opacity-50"
        >
          {running ? t(uiLang, "runnerRunning") : t(uiLang, "runnerRun")}
        </button>
      </div>

      <label className="mt-3 block">
        <span className="text-xs text-slate-400">{t(uiLang, "runnerArguments")}</span>
        <textarea
          value={args}
          onChange={(event) => setArgs(event.target.value)}
          rows={4}
          spellCheck={false}
          className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 font-mono text-xs text-slate-200 outline-none focus:border-lab-accent/60"
        />
      </label>

      {result && (
        <div className="mt-4">
          <span className="text-xs text-slate-400">{t(uiLang, "runnerResult")}</span>
          <pre className="mt-1 max-h-64 overflow-auto rounded-lg border border-white/10 bg-slate-950/60 p-3 font-mono text-xs leading-relaxed text-slate-300">
            {result}
          </pre>
        </div>
      )}
    </section>
  );
}
