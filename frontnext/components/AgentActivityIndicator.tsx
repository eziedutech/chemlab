"use client";

import { useEffect } from "react";
import { useLabStore } from "../store/labStore";

const VISIBLE_MS = 6000;

/**
 * Toast stack that names every tool the agent calls.
 *
 * This is the visible proof that a real tool call happened rather than a
 * scheduled animation, so the text is deliberately large enough to stay
 * readable when the demo video is watched on a phone.
 */
export function AgentActivityIndicator() {
  const agentActivity = useLabStore((state) => state.agentActivity);
  const dropAgentActivity = useLabStore((state) => state.dropAgentActivity);

  useEffect(() => {
    if (agentActivity.length === 0) return;

    const timers = agentActivity.map((activity) =>
      setTimeout(
        () => dropAgentActivity(activity.id),
        Math.max(0, activity.at + VISIBLE_MS - Date.now()),
      ),
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [agentActivity, dropAgentActivity]);

  if (agentActivity.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-3"
      aria-live="polite"
    >
      {agentActivity.map((activity) => (
        <div
          key={activity.id}
          className="glass rounded-lg border-lab-accent/30 bg-slate-950/70 px-5 py-4 text-lg font-medium text-slate-300 sm:text-xl"
        >
          <span aria-hidden="true">&#128295;</span>{" "}
          {activity.origin === "manual" ? "run by hand:" : "agent called:"}{" "}
          <span className="font-mono text-white">{activity.toolName}</span>
        </div>
      ))}
    </div>
  );
}
