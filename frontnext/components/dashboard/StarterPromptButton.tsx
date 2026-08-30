"use client";

import { useState } from "react";
import { STARTER_PROMPT, t } from "../../lib/i18n";
import { useLabStore } from "../../store/labStore";

/**
 * Hands the visitor the prompt that drives the whole demo.
 *
 * The clipboard API is not available on every browser or over plain HTTP, so
 * wherever this button appears the prompt is also on the page as selectable
 * text: the button is a convenience, never the only way to get it.
 */
export function StarterPromptButton({ bare = false }: { bare?: boolean }) {
  const uiLang = useLabStore((state) => state.uiLang);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(STARTER_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard refused. The text alongside is still there to select by hand.
      setCopied(false);
    }
  };

  const button = (
    <button
      type="button"
      onClick={copy}
      className="glass rounded-lg px-3 py-1.5 text-xs text-slate-100 transition hover:bg-white/10"
    >
      {copied ? t(uiLang, "starterCopied") : t(uiLang, "starterCopy")}
    </button>
  );

  if (bare) return button;

  return (
    <section className="glass-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium tracking-wide text-slate-200">
          {t(uiLang, "starterTitle")}
        </h2>
        {button}
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
        {t(uiLang, "starterHint")}
      </p>
      <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-slate-950/50 p-4 text-xs leading-relaxed text-slate-400">
        {STARTER_PROMPT}
      </pre>
    </section>
  );
}
