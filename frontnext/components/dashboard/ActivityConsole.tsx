"use client";

import { useEffect, useRef, useState } from "react";
import { t } from "../../lib/i18n";
import { useLabStore } from "../../store/labStore";

/** Colour and glyph per outcome, so a failure reads as one at a glance. */
const STATUS: Record<string, { mark: string; className: string }> = {
  running: { mark: "..", className: "text-slate-400" },
  ok: { mark: "ok", className: "text-teal-300" },
  failed: { mark: "!!", className: "text-amber-300" },
};

function clock(at: number): string {
  return new Date(at).toLocaleTimeString([], {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * A console of the tool calls that have run.
 *
 * This replaced a toast that appeared and vanished. A console keeps the
 * history, which is what someone watching actually wants: the order the agent
 * did things in, and whether each call succeeded. The newest line stays pinned
 * at the bottom and is emphasised, so it still reads at a glance on a video.
 */
export function ActivityConsole() {
  const activity = useLabStore((state) => state.agentActivity);
  const uiLang = useLabStore((state) => state.uiLang);
  const [open, setOpen] = useState(true);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scroller.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [activity, open]);

  const latest = activity[activity.length - 1];

  return (
    <div className="glass-panel pointer-events-auto w-full overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-medium tracking-wide text-slate-200">
          <span aria-hidden="true">&#128295;</span>
          {t(uiLang, "activity")}
        </span>
        <span className="flex items-center gap-2">
          {latest && (
            <span className="font-mono text-[11px] text-slate-400">
              {activity.length}
            </span>
          )}
          <span aria-hidden="true" className="text-slate-400">
            {open ? "–" : "+"}
          </span>
        </span>
      </button>

      {open && (
        <div
          ref={scroller}
          className="scroll-quiet max-h-44 overflow-y-auto border-t border-white/[0.08] px-4 py-3"
        >
          {activity.length === 0 ? (
            <p className="font-mono text-[11px] leading-relaxed text-slate-400">
              {t(uiLang, "noActivity")}
            </p>
          ) : (
            <ol className="space-y-1">
              {activity.map((entry, index) => {
                const status = STATUS[entry.status] ?? STATUS.running;
                const isLatest = index === activity.length - 1;
                return (
                  <li
                    key={entry.id}
                    className={`flex items-baseline gap-2 font-mono leading-relaxed ${
                      isLatest ? "text-[13px] text-slate-100" : "text-[11px] text-slate-400"
                    }`}
                  >
                    <span className="text-slate-500">{clock(entry.at)}</span>
                    <span className={status.className}>{status.mark}</span>
                    <span className="text-slate-500">
                      {entry.origin === "manual" ? "manual" : "agent"}
                    </span>
                    <span className={isLatest ? "text-white" : "text-slate-300"}>
                      {entry.toolName}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
