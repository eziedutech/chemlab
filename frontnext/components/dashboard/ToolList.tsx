"use client";

import { toolDescriptors } from "../../lib/webmcp/registerTools";

/** The seven tools, listed so a judge can compare them against the agent's answer. */
export function ToolList() {
  return (
    <ol className="space-y-2 text-sm text-slate-300">
      {toolDescriptors.map((tool, index) => (
        <li key={tool.name} className="flex gap-3">
          <span className="w-5 shrink-0 text-right text-slate-500">
            {index + 1}.
          </span>
          <span>
            <span className="font-mono text-lab-accent">{tool.name}</span>
            <span className="block text-slate-400">{tool.description}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
