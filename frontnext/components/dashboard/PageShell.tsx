"use client";

import { AgentActivityIndicator } from "../AgentActivityIndicator";
import { LanguageToggle } from "./LanguageToggle";
import { ManualToolRunner } from "./ManualToolRunner";
import { ObservationPanel } from "./ObservationPanel";
import { SafetyAlertBanner } from "./SafetyAlertBanner";
import { StarterPromptButton } from "./StarterPromptButton";
import { ToolList } from "./ToolList";
import { WebMcpStatusBadge } from "./WebMcpStatusBadge";
import { LabSceneCanvas } from "../scene/LabSceneCanvas";
import { WebMcpRegistrar } from "../webmcp/WebMcpRegistrar";
import { t } from "../../lib/i18n";
import { useLabStore } from "../../store/labStore";

/**
 * The page itself.
 *
 * A client component because every panel below reads the interface language
 * from the store, and the language is only known once the URL can be read.
 */
export function PageShell({ apiBaseUrl }: { apiBaseUrl: string }) {
  const uiLang = useLabStore((state) => state.uiLang);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-7 px-6 py-14">
      <WebMcpRegistrar />

      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            WebMCP Challenge
          </p>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <WebMcpStatusBadge />
          </div>
        </div>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          EZI ChemLab
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-slate-300">
          {t(uiLang, "tagline")}
        </p>
      </header>

      <SafetyAlertBanner />

      <LabSceneCanvas />

      <ObservationPanel />

      <StarterPromptButton />

      <section className="glass-panel p-6">
        <h2 className="text-sm font-medium tracking-wide text-slate-200">
          {t(uiLang, "toolsTitle")}
        </h2>
        <p className="mt-1.5 text-sm text-slate-400">{t(uiLang, "toolsHint")}</p>
        <div className="mt-5">
          <ToolList />
        </div>
      </section>

      <ManualToolRunner />

      <section className="glass-panel p-6">
        <h2 className="text-sm font-medium tracking-wide text-slate-200">
          {t(uiLang, "buildTitle")}
        </h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-[auto,1fr] sm:gap-x-6">
          <dt className="text-slate-400">Frontend</dt>
          <dd className="text-slate-200">
            Next.js 14 App Router, React 18, TypeScript, Tailwind
          </dd>
          <dt className="text-slate-400">{t(uiLang, "backendHealth")}</dt>
          <dd className="font-mono text-slate-200">{apiBaseUrl}/health</dd>
        </dl>
      </section>

      <AgentActivityIndicator />
    </main>
  );
}
