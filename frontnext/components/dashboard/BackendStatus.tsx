"use client";

import { useEffect, useState } from "react";
import { resolveApiBaseUrl } from "../../lib/api";

interface Health {
  status: string;
  version: string;
  providers: number;
}

/**
 * Where the backend actually is, and whether it answers.
 *
 * The URL is the one the page will really call, resolved at runtime, rather
 * than whatever was compiled into the bundle. Showing the compiled value here
 * would be misleading precisely when it matters: when the two disagree.
 */
export function BackendStatus() {
  const [url, setUrl] = useState<string | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [reachable, setReachable] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const baseUrl = await resolveApiBaseUrl();
      if (cancelled) return;
      setUrl(baseUrl);

      try {
        const response = await fetch(`${baseUrl}/health`, { cache: "no-store" });
        if (cancelled) return;
        if (!response.ok) {
          setReachable(false);
          return;
        }
        setHealth((await response.json()) as Health);
        setReachable(true);
      } catch {
        if (!cancelled) setReachable(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-slate-200">{url ? `${url}/health` : "resolving"}</span>
      {reachable === true && health && (
        <span className="text-xs text-teal-300/90">
          {health.status}, v{health.version}, {health.providers} provider
          {health.providers === 1 ? "" : "s"}
        </span>
      )}
      {reachable === false && (
        <span className="text-xs text-amber-300/90">unreachable</span>
      )}
    </span>
  );
}
