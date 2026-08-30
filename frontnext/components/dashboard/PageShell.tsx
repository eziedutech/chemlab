"use client";

import { useState } from "react";
import { AgentActivityIndicator } from "../AgentActivityIndicator";
import { LabSceneCanvas } from "../scene/LabSceneCanvas";
import { WebMcpRegistrar } from "../webmcp/WebMcpRegistrar";
import { BackendStatus } from "./BackendStatus";
import { IconRail } from "./IconRail";
import { LabStatePanel } from "./LabStatePanel";
import { LanguageToggle } from "./LanguageToggle";
import { ManualToolRunner } from "./ManualToolRunner";
import { ModeToggle } from "./ModeToggle";
import { ObservationPanel } from "./ObservationPanel";
import { SafetyAlertBanner } from "./SafetyAlertBanner";
import { StarterPromptButton } from "./StarterPromptButton";
import { WebMcpStatusBadge } from "./WebMcpStatusBadge";
import { t } from "../../lib/i18n";
import { useLabStore } from "../../store/labStore";

/**
 * The page.
 *
 * The lab fills the window and everything else floats over it in glass, so the
 * experiment is the subject rather than a thumbnail inside a document. The
 * left rail is icons only for the same reason: reading material opens on
 * demand instead of occupying the room.
 */
export function PageShell() {
  const uiLang = useLabStore((state) => state.uiLang);
  const mode = useLabStore((state) => state.mode);
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      <WebMcpRegistrar />

      {/* The lab itself, filling the window behind everything. */}
      <div className="absolute inset-0">
        <LabSceneCanvas />
      </div>
      {/* Enough shading for glass panels to stay legible over a lit room. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(130%_100%_at_40%_10%,rgba(6,11,20,0.18),rgba(6,11,20,0.78))]"
      />

      {/* Top bar. */}
      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-3 px-3 py-3 sm:px-5">
        <div className="glass flex items-center gap-3 rounded-full px-4 py-2">
          <span className="whitespace-nowrap text-sm font-semibold tracking-tight text-slate-100">
            EZI ChemLab
          </span>
          <span className="hidden text-[11px] uppercase tracking-[0.22em] text-slate-400 sm:inline">
            WebMCP Challenge
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <LanguageToggle />
          <ModeToggle />
          <WebMcpStatusBadge />
        </div>
      </header>

      {/* Left rail. */}
      <div className="pointer-events-none absolute left-3 top-1/2 z-30 -translate-y-1/2 sm:left-5">
        <IconRail />
      </div>

      {/* Safety alerts sit under the top bar, over the scene. */}
      <div className="pointer-events-none absolute inset-x-0 top-20 z-30 flex justify-center px-4">
        <div className="pointer-events-auto w-full max-w-xl">
          <SafetyAlertBanner />
        </div>
      </div>

      {/* On a narrow screen the right panel slides in from a button, rather
          than taking the room away from the experiment. */}
      <button
        type="button"
        onClick={() => setPanelOpen((open) => !open)}
        className="glass absolute bottom-4 right-4 z-40 rounded-full px-4 py-2 text-xs text-slate-100 lg:hidden"
      >
        {panelOpen ? t(uiLang, "close") : t(uiLang, "labState")}
      </button>

      <aside
        className={`absolute right-0 top-0 z-30 flex h-full w-full max-w-sm flex-col gap-3 overflow-y-auto p-3 pt-20 transition-transform sm:p-5 sm:pt-20 lg:translate-x-0 ${
          panelOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        <LabStatePanel />
        <ObservationPanel />
        {mode === "manual" ? <ManualToolRunner /> : <StarterPromptButton />}

        <section className="glass-panel p-5">
          <h2 className="text-sm font-medium tracking-wide text-slate-200">
            {t(uiLang, "backendHealth")}
          </h2>
          <div className="mt-3 text-xs">
            <BackendStatus />
          </div>
        </section>
      </aside>

      <AgentActivityIndicator />
    </div>
  );
}
