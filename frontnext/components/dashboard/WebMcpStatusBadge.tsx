"use client";

import { useLabStore } from "../../store/labStore";
import { toolNames } from "../../lib/webmcp/registerTools";

/**
 * Shows whether the browser exposes WebMCP, and how many tools are registered.
 * When it is not detected the app stays usable, it simply says so.
 */
export function WebMcpStatusBadge() {
  const webmcp = useLabStore((state) => state.webmcp);

  if (!webmcp.checked) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-lab-panel px-3 py-1 text-sm text-slate-400">
        <span className="h-2 w-2 rounded-full bg-slate-500" />
        WebMCP: checking
      </span>
    );
  }

  if (!webmcp.detected) {
    return (
      <span
        className="inline-flex items-center gap-2 rounded-full border border-amber-600/60 bg-amber-500/10 px-3 py-1 text-sm text-amber-300"
        title={`Tools ready to register: ${toolNames.join(", ")}`}
      >
        <span className="h-2 w-2 rounded-full bg-amber-400" />
        WebMCP: not detected
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-emerald-600/60 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300"
      title={toolNames.join(", ")}
    >
      <span className="h-2 w-2 rounded-full bg-emerald-400" />
      WebMCP: detected, {webmcp.toolCount} tools registered
    </span>
  );
}
