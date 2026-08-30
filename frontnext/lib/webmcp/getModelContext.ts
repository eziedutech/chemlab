/**
 * Resolver for the WebMCP entry point.
 *
 * The specification moved from `navigator.modelContext` to
 * `document.modelContext` in July 2026, and older Chrome origin trial builds
 * still expose the previous location. Judges may be on either one, so nothing
 * in this codebase touches those globals directly: everything goes through
 * this resolver.
 */

export interface ToolDescriptor {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: any) => Promise<unknown>;
}

export interface ModelContextLike {
  registerTool(tool: ToolDescriptor): void;
  unregisterTool?(name: string): void;
}

export function getModelContext(): ModelContextLike | null {
  if (typeof window === "undefined") return null; // guard against SSR
  const anyDoc = document as any;
  const anyNav = navigator as any;
  return anyDoc?.modelContext ?? anyNav?.modelContext ?? null;
}

/**
 * Minimum contract every tool result must satisfy. A tool that resolves to
 * `undefined` leaves the agent blind, so `success` is always present.
 */
export type ToolResult =
  | { success: true; [key: string]: unknown }
  | { success: false; reason: string; [key: string]: unknown };
