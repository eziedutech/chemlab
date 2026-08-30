"use client";

import { useLabStore } from "../../store/labStore";
import { toolNames } from "../../lib/webmcp/registerTools";

const BASE =
  "glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm";

/**
 * Shows whether the browser exposes WebMCP, and how many tools are registered.
 * When it is not detected the app stays usable, it simply says so.
 */
export function WebMcpStatusBadge() {
  const webmcp = useLabStore((state) => state.webmcp);

  if (!webmcp.checked) {
    return (
      <span className={`${BASE} text-slate-400`}>
        <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
        WebMCP: checking
      </span>
    );
  }

  if (!webmcp.detected) {
    return (
      <span
        className={`${BASE} text-amber-200/90`}
        title={`Tools ready to register: ${toolNames.join(", ")}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
        WebMCP: not detected
      </span>
    );
  }

  return (
    <span className={`${BASE} text-teal-200/90`} title={toolNames.join(", ")}>
      <span className="h-1.5 w-1.5 rounded-full bg-teal-300" />
      WebMCP: detected, {webmcp.toolCount} tools registered
    </span>
  );
}
