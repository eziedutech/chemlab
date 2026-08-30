/**
 * Client for the Rust backend.
 *
 * Every call has a deadline and a fallback: a tool must always resolve to
 * something the agent can narrate, even when the backend is down. The base URL
 * is inlined at build time, so changing it means rebuilding the frontend.
 */

const BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"
).replace(/\/+$/, "");

const TIMEOUT_MS = 20000;

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

async function postJson<T>(path: string, body: unknown): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
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

export const apiBaseUrl = BASE_URL;
