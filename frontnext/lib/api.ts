/**
 * Client for the Rust backend.
 *
 * Every call has a deadline and a fallback: a tool must always resolve to
 * something the agent can narrate, even when the backend is down.
 *
 * The backend URL is resolved at runtime from /runtime-config, falling back to
 * the value compiled into the bundle. That matters because the two services are
 * deployed separately: without it, pointing the frontend at a different backend
 * would mean a rebuild rather than a restart.
 */

const BUILD_TIME_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"
).replace(/\/+$/, "");

const TIMEOUT_MS = 20000;
const CONFIG_TIMEOUT_MS = 4000;

export type TextSource = "static" | "cache" | "llm" | "fallback" | "offline";

export interface ExplanationResponse {
  explanation: string;
  step_number: number;
  total_steps: number;
  title: string;
  diagram_svg_hint?: string;
  source: TextSource;
}

export interface LabReportResponse {
  formatted_report: string;
  learning_points: string[];
  source: TextSource;
}

/** Resolved once per page load, then reused. */
let baseUrlPromise: Promise<string> | null = null;

export async function resolveApiBaseUrl(): Promise<string> {
  if (typeof window === "undefined") return BUILD_TIME_BASE_URL;

  if (!baseUrlPromise) {
    baseUrlPromise = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), CONFIG_TIMEOUT_MS);
      try {
        const response = await fetch("/runtime-config", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) return BUILD_TIME_BASE_URL;
        const config = (await response.json()) as { apiBaseUrl?: string };
        return config.apiBaseUrl || BUILD_TIME_BASE_URL;
      } catch {
        return BUILD_TIME_BASE_URL;
      } finally {
        clearTimeout(timer);
      }
    })();
  }

  return baseUrlPromise;
}

async function postJson<T>(path: string, body: unknown): Promise<T | null> {
  const baseUrl = await resolveApiBaseUrl();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    // The caller substitutes its own text. A tool never throws at the agent.
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function fetchExplanation(body: {
  subject: string;
  topic: string;
  step_number: number;
  reaction_context?: string;
  lang: string;
}): Promise<ExplanationResponse | null> {
  return postJson<ExplanationResponse>("/api/generate-explanation", body);
}

export function fetchLabReport(body: {
  topic: string;
  observations: string;
  conclusion_draft?: string;
  lang: string;
}): Promise<LabReportResponse | null> {
  return postJson<LabReportResponse>("/api/generate-lab-report", body);
}

export const apiBaseUrl = BUILD_TIME_BASE_URL;
