"use client";

import { useState } from "react";
import { STARTER_PROMPT, t } from "../../lib/i18n";
import { useLabStore } from "../../store/labStore";

/**
 * Hands the visitor the prompt that drives the whole demo.
 *
 * The clipboard API is not available on every browser or over plain HTTP, so
 * the prompt is also on the page as selectable text: the button is a
 * convenience, never the only way to get it.
 */
export function StarterPromptButton() {
  const uiLang = useLabStore((state) => state.uiLang);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(STARTER_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard refused. The text below is still there to select by hand.
      setCopied(false);
    }
  };

  return (
    <section className="glass-panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium tracking-wide text-slate-200">
          {t(uiLang, "starterTitle")}
        </h2>
        <button
          type="button"
          onClick={copy}
          className="glass rounded-lg px-3 py-1.5 text-xs text-slate-100 transition hover:bg-white/10"
        >
          {copied ? t(uiLang, "starterCopied") : t(uiLang, "starterCopy")}
        </button>
      </div>
      <pre className="mt-4 max-h-56 overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-slate-950/50 p-4 text-xs leading-relaxed text-slate-400">
        {STARTER_PROMPT}
      </pre>
    </section>
  );
}
