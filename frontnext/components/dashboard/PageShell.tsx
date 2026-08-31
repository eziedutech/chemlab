"use client";

import { useState } from "react";
import { ActivityConsole } from "./ActivityConsole";
import { LabSceneCanvas } from "../scene/LabSceneCanvas";
import { WebMcpRegistrar } from "../webmcp/WebMcpRegistrar";
import { IconRail } from "./IconRail";
import { LabStatePanel } from "./LabStatePanel";
import { LanguageToggle } from "./LanguageToggle";
import { ManualToolRunner } from "./ManualToolRunner";
import { ModeToggle } from "./ModeToggle";
import { ObservationPanel } from "./ObservationPanel";
import { SafetyAlertBanner } from "./SafetyAlertBanner";
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
      {/* A vignette, and only a vignette.

          This used to be a wash reaching 62 per cent black over the whole
          window, which is a sheet of smoked film laid across the lab. No
          material setting survives that: the glass was reading grey because
          everything was. The panels carry their own dark fill and do not need
          the page dimmed behind them, so the shading now stays at the corners
          where the panels actually sit and leaves the middle of the bench
          alone. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_95%_at_50%_45%,rgba(6,11,20,0)_38%,rgba(6,11,20,0.16)_68%,rgba(6,11,20,0.42)_100%)]"
      />

      {/* Top bar. */}
      <header className="absolute inset-x-0 top-0 z-40 flex items-center justify-between gap-3 px-3 py-3 sm:px-5">
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

      {/* The right column runs the full height of the window, which means its
          empty space used to sit over the header and over the bench: a click on
          the language or mode toggle landed on this element instead of on the
          button, and a drag meant to orbit the camera did nothing. The column
          itself now lets everything through and only the panels in it take a
          pointer. */}
      <aside
        className={`pointer-events-none absolute right-0 top-0 z-30 flex h-full w-full max-w-sm flex-col gap-3 overflow-hidden p-3 pt-20 transition-transform sm:p-5 sm:pt-20 lg:translate-x-0 ${
          panelOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        {/* The reading matter scrolls. The runner is tall and used to push
            everything below it off the bottom of the column, which is what
            squeezed the console into a slit and left the whole column
            scrolling as one long strip. */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto [&>*]:pointer-events-auto">
          <LabStatePanel />
          <ObservationPanel />
          {mode === "manual" && <ManualToolRunner />}
        </div>

        {/* The console keeps its own place at the foot of the column, whatever
            is above it. It is the record of what the agent did, so it should
            not be the thing that gets pushed out of sight. The starter prompt
            is not repeated here: it already opens from the rail. */}
        <div className="pointer-events-auto shrink-0">
          <ActivityConsole />
        </div>
      </aside>

    </div>
  );
}
