"use client";

import { t } from "../../lib/i18n";
import { useLabStore } from "../../store/labStore";

const MODES = ["webmcp", "manual"] as const;

/**
 * Who is expected to drive the lab.
 *
 * WebMCP is the whole point, so it is the default. Manual is the way in for a
 * browser that does not expose WebMCP yet, and it runs the same tools rather
 * than a mock of them, which is why the toggle only changes what the right
 * panel offers, never what the tools do.
 */
export function ModeToggle() {
  const mode = useLabStore((state) => state.mode);
  const setMode = useLabStore((state) => state.setMode);
  const uiLang = useLabStore((state) => state.uiLang);

  return (
    <div
      className="glass inline-flex items-center gap-0.5 rounded-full p-0.5 text-xs"
      title={t(uiLang, mode === "webmcp" ? "modeHintWebmcp" : "modeHintManual")}
    >
      {MODES.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setMode(option)}
          aria-pressed={mode === option}
          className={`rounded-full px-3 py-1 tracking-wide transition ${
            mode === option
              ? "bg-white/10 text-slate-100"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          {t(uiLang, option === "webmcp" ? "modeWebmcp" : "modeManual")}
        </button>
      ))}
    </div>
  );
}
