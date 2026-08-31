"use client";

import { useState } from "react";
import { t, topicLabel } from "../../lib/i18n";
import { toolDescriptors } from "../../lib/webmcp/registerTools";
import { useLabStore, type Topic } from "../../store/labStore";

const TOPICS: Topic[] = ["asam_basa", "elektrolit", "massa_jenis"];

/** Which subject each topic belongs to, as the tool schema requires. */
const SUBJECT: Record<Topic, "kimia" | "fisika"> = {
  asam_basa: "kimia",
  elektrolit: "kimia",
  massa_jenis: "fisika",
};

/**
 * Moving between the three topics by hand.
 *
 * It runs `switch_experiment_mode`, the same tool an agent calls, rather than
 * writing to the store: the apparatus on the bench, the substances on offer
 * and the reset of the beaker are all that tool's work, and a shortcut past it
 * would be a second implementation to keep in step. The call is marked as
 * manual so the activity console says honestly who asked for it.
 */
export function TopicSwitcher() {
  const uiLang = useLabStore((state) => state.uiLang);
  const active = useLabStore((state) => state.activeTopic);
  const [busy, setBusy] = useState(false);

  const go = async (topic: Topic) => {
    if (busy || topic === active) return;
    const tool = toolDescriptors.find((entry) => entry.name === "switch_experiment_mode");
    if (!tool) return;
    setBusy(true);
    try {
      useLabStore.getState().markNextCallManual();
      await tool.execute({ subject: SUBJECT[topic], topic });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="glass flex items-center gap-0.5 rounded-full p-0.5 text-xs"
      role="group"
      aria-label={t(uiLang, "switchTopic")}
    >
      {TOPICS.map((topic) => (
        <button
          key={topic}
          type="button"
          onClick={() => go(topic)}
          disabled={busy}
          aria-pressed={topic === active}
          className={`whitespace-nowrap rounded-full px-3 py-1 tracking-wide transition disabled:opacity-60 ${
            topic === active
              ? "bg-white/10 text-slate-100"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          {topicLabel(topic, uiLang)}
        </button>
      ))}
    </div>
  );
}
