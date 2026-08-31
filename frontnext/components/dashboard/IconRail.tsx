"use client";

import { useState, type ReactNode } from "react";
import {
  STARTER_PROMPT,
  t,
  TOOL_SUMMARY,
  topicLabel,
  type StringKey,
} from "../../lib/i18n";
import {
  TOPIC_SUBSTANCES,
  pairsFor,
  substanceFormula,
  substanceLabel,
} from "../../lib/reactions/reactionDefinitions";
import { toolDescriptors } from "../../lib/webmcp/registerTools";
import { useLabStore, type Topic } from "../../store/labStore";
import { GlassModal } from "./GlassModal";
import { StarterPromptButton } from "./StarterPromptButton";

type PanelId = "info" | "commands" | "tools" | "topics" | "credits";

/** Line art, drawn inline so the page pulls in no icon library. */
const ICONS: Record<PanelId, ReactNode> = {
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </>
  ),
  commands: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 9l3 3-3 3" />
      <path d="M13 15h4" />
    </>
  ),
  tools: (
    <>
      <path d="M14.7 6.3a4 4 0 0 1-5 5L5 16v3h3l4.7-4.7a4 4 0 0 0 5-5l-2.2 2.2-2.1-2.1z" />
    </>
  ),
  topics: (
    <>
      <path d="M9 3v6l-4.6 8A2 2 0 0 0 6.2 20h11.6a2 2 0 0 0 1.8-3L15 9V3" />
      <path d="M9 3h6" />
      <path d="M7.5 14h9" />
    </>
  ),
  credits: (
    <>
      <path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6L3.4 9.4l6-.8z" />
    </>
  ),
};

const PANEL_TITLES: Record<PanelId, StringKey> = {
  info: "navInfo",
  commands: "navCommands",
  tools: "navTools",
  topics: "navTopics",
  credits: "navCredits",
};

/**
 * The icon rail down the left edge.
 *
 * Only icons are on screen, so the lab behind them stays visible; the reading
 * material lives in a panel that opens when one is clicked. Everything in here
 * is reference material a judge or a student might want mid session, not
 * controls that change the experiment.
 */
export function IconRail() {
  const uiLang = useLabStore((state) => state.uiLang);
  const [open, setOpen] = useState<PanelId | null>(null);

  const items: PanelId[] = ["info", "commands", "tools", "topics", "credits"];

  return (
    <>
      <nav className="glass pointer-events-auto flex flex-col gap-1 rounded-2xl p-1.5">
        {items.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setOpen(id)}
            title={t(uiLang, PANEL_TITLES[id])}
            aria-label={t(uiLang, PANEL_TITLES[id])}
            className={`rounded-xl p-2.5 transition ${
              open === id
                ? "bg-white/12 text-slate-100"
                : "text-slate-400 hover:bg-white/[0.07] hover:text-slate-100"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {ICONS[id]}
            </svg>
          </button>
        ))}
      </nav>

      {open && (
        <GlassModal title={t(uiLang, PANEL_TITLES[open])} onClose={() => setOpen(null)}>
          {open === "info" && (
            <div className="space-y-4 text-base leading-relaxed text-slate-300">
              <p>{t(uiLang, "aboutBody")}</p>
              <p className="text-slate-400">{t(uiLang, "aboutHow")}</p>

              <div className="border-t border-white/[0.08] pt-4">
                <h3 className="font-medium text-slate-100">
                  {t(uiLang, "aboutOpenTitle")}
                </h3>
                <p className="mt-2 text-slate-400">{t(uiLang, "aboutOpenBody")}</p>
                <p className="mt-3 whitespace-pre-line text-slate-300">
                  {t(uiLang, "aboutOpenSteps")}
                </p>
              </div>
            </div>
          )}

          {open === "commands" && (
            <div className="space-y-4">
              <p className="text-base leading-relaxed text-slate-300">
                {t(uiLang, "commandsBody")}
              </p>
              <StarterPromptButton bare />
              <pre className="whitespace-pre-wrap rounded-lg border border-white/10 bg-slate-950/50 p-4 text-sm leading-relaxed text-slate-400">
                {STARTER_PROMPT}
              </pre>
            </div>
          )}

          {open === "tools" && (
            <>
            <p className="mb-3 text-sm leading-relaxed text-slate-400">
              {t(uiLang, "toolsDisplayNote")}
            </p>
            <ol className="divide-y divide-white/[0.07] text-base">
              {toolDescriptors.map((tool, index) => (
                <li key={tool.name} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                  <span className="w-4 shrink-0 pt-0.5 text-right font-mono text-sm text-slate-400">
                    {index + 1}
                  </span>
                  <div>
                    <span className="font-mono text-sm text-lab-accent">
                      {tool.name}
                    </span>
                    <p className="mt-1 leading-relaxed text-slate-400">
                      {TOOL_SUMMARY[tool.name]?.[uiLang] ?? tool.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            </>
          )}

          {open === "topics" && (
            <div className="space-y-5 text-base">
              <p className="leading-relaxed text-slate-300">{t(uiLang, "topicsBody")}</p>
              {(Object.keys(TOPIC_SUBSTANCES) as Topic[]).map((topic) => (
                <div key={topic}>
                  <h3 className="font-medium text-slate-100">
                    {topicLabel(topic, uiLang)}
                    <span className="ml-2 font-mono text-sm text-slate-400">{topic}</span>
                  </h3>
                  <ul className="mt-2 space-y-1 text-slate-300">
                    {TOPIC_SUBSTANCES[topic].map((name) => (
                      <li key={name} className="flex items-baseline gap-2">
                        <span>{substanceLabel(name, uiLang)}</span>
                        {substanceFormula(name) && (
                          <span className="font-mono text-sm text-lab-accent">
                            {substanceFormula(name)}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <ul className="mt-3 space-y-1 text-sm text-slate-400">
                    {pairsFor(topic).map(([a, b]) => (
                      <li key={`${a}+${b}`}>
                        {substanceLabel(a, uiLang)} + {substanceLabel(b, uiLang)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {open === "credits" && (
            <div className="space-y-3 text-base leading-relaxed text-slate-300">
              <p>{t(uiLang, "creditsBody")}</p>
            </div>
          )}
        </GlassModal>
      )}
    </>
  );
}
