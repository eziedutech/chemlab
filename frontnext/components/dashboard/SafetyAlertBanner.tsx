"use client";

import { useEffect } from "react";
import { t } from "../../lib/i18n";
import { useLabStore } from "../../store/labStore";

/** Matches the auto_dismiss_ms the tool reports back to the agent. */
const AUTO_DISMISS_MS = 8000;

/**
 * Educational safety alert.
 *
 * Safety awareness is part of the lesson here, not an error state, so the
 * banner explains rather than scolds and clears itself after a while. The
 * timing matches what trigger_safety_alert tells the agent, so what the agent
 * says and what the student sees do not disagree.
 */
export function SafetyAlertBanner() {
  const alert = useLabStore((state) => state.safetyAlert);
  const setSafetyAlert = useLabStore((state) => state.setSafetyAlert);
  const uiLang = useLabStore((state) => state.uiLang);

  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setSafetyAlert(null), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [alert, setSafetyAlert]);

  if (!alert) return null;

  const warning = alert.severity === "warning";

  return (
    <div
      role="status"
      className={`glass flex items-start gap-3 rounded-xl px-5 py-4 ${
        warning ? "border-amber-400/40 text-amber-100" : "border-sky-400/35 text-sky-100"
      }`}
    >
      <span
        aria-hidden="true"
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
          warning ? "bg-amber-300" : "bg-sky-300"
        }`}
      />
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
          {warning ? t(uiLang, "safetyWarning") : t(uiLang, "safetyNote")}
        </p>
        <p className="mt-1 text-sm leading-relaxed">{alert.reason}</p>
      </div>
      <button
        type="button"
        onClick={() => setSafetyAlert(null)}
        className="ml-auto shrink-0 rounded-md px-2 py-1 text-xs text-slate-400 transition hover:text-slate-100"
      >
        {t(uiLang, "dismiss")}
      </button>
    </div>
  );
}
