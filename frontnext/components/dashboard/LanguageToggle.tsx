"use client";

import { useEffect } from "react";
import { initialLang, type UiLang } from "../../lib/i18n";
import { useLabStore } from "../../store/labStore";

const OPTIONS: UiLang[] = ["id", "en"];

/**
 * Interface language switch.
 *
 * The starting language comes from the URL, so the testing instructions can
 * hand judges a link that opens in English, while the classroom default stays
 * Indonesian. Reading it in an effect rather than during render keeps the
 * server rendered markup and the first client render identical.
 */
export function LanguageToggle() {
  const uiLang = useLabStore((state) => state.uiLang);
  const setUiLang = useLabStore((state) => state.setUiLang);

  useEffect(() => {
    setUiLang(initialLang());
  }, [setUiLang]);

  return (
    <div className="glass inline-flex items-center gap-0.5 rounded-full p-0.5 text-xs">
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setUiLang(option)}
          aria-pressed={uiLang === option}
          className={`rounded-full px-2.5 py-1 uppercase tracking-wider transition ${
            uiLang === option
              ? "bg-white/10 text-slate-100"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
