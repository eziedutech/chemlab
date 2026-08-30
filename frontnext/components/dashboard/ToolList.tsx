"use client";

import { toolDescriptors } from "../../lib/webmcp/registerTools";

/** The seven tools, listed so a judge can compare them against the agent's answer. */
export function ToolList() {
  return (
    <ol className="divide-y divide-white/[0.07] text-sm">
      {toolDescriptors.map((tool, index) => (
        <li key={tool.name} className="flex gap-4 py-3 first:pt-0 last:pb-0">
          <span className="w-4 shrink-0 pt-0.5 text-right font-mono text-xs text-slate-500">
            {index + 1}
          </span>
          <div>
            <span className="font-mono text-[13px] text-lab-accent">
              {tool.name}
            </span>
            <p className="mt-1 leading-relaxed text-slate-400">
              {tool.description}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
