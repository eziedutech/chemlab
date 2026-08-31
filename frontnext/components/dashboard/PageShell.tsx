"use client";

import { useEffect, useState } from "react";
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
import { TopicSwitcher } from "./TopicSwitcher";
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
/** Whether the window is wide enough to show the right column by default. */
function useWideScreen(): boolean {
  const [wide, setWide] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setWide(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return wide;
}

export function PageShell() {
  const uiLang = useLabStore((state) => state.uiLang);
  const mode = useLabStore((state) => state.mode);
  const wide = useWideScreen();
  /*
   * Null means "whatever the window size suggests": open on a laptop, out of
   * the way on a phone. Once the button is pressed that choice wins, at any
   * width, which is what the button is for.
   */
  const [override, setOverride] = useState<boolean | null>(null);
  const panelsVisible = override ?? wide;

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
      <header className="absolute inset-x-0 top-0 z-40 flex items-center justify-between gap-3 px-3 py-3 sm:px-5 md:grid md:grid-cols-[1fr_auto_1fr]">
        {/* The mark and the name, and nothing else. The pill used to carry the
            competition name as well, which made it a long bar of glass across
            the corner for no reading anyone needed. */}
        <div className="glass flex w-fit items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4">
          <img
            src="/logo.png"
            alt=""
            width={53}
            height={64}
            className="h-6 w-auto"
          />
          <span className="whitespace-nowrap text-sm font-semibold tracking-tight text-slate-100">
            EZI ChemLab
          </span>
        </div>

        {/* Moving topics by hand, in the middle where the eye lands first.
            It calls the same tool the agent calls. */}
        <div className="hidden md:flex md:justify-center">
          <TopicSwitcher />
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
      {/* Showing and hiding the right column, at every width.
          It used to disappear above the large breakpoint, where the column is
          always open, so there was no way to clear the panels off the bench
          and no way to guess where the button had gone. */}
      <button
        type="button"
        onClick={() => setOverride(!panelsVisible)}
        aria-expanded={panelsVisible}
        className="glass absolute bottom-4 right-4 z-40 rounded-full px-4 py-2 text-xs text-slate-100 transition hover:bg-white/10"
      >
        {panelsVisible ? t(uiLang, "hidePanels") : t(uiLang, "showPanels")}
      </button>

      {/* The right column, shown or genuinely not rendered.

          It used to be parked off screen with a transform, which is the usual
          trick and did not work here: the class went on, the custom properties
          were right, and the element did not move. Not rendering it is not a
          workaround for that so much as the honest description of the state,
          and it is what the button says it does.

          It runs the full height of the window, so its empty space sits over
          the header and over the bench. That used to swallow clicks on the
          language and mode toggles and drags meant to orbit the camera, hence
          the pointer events: the column passes everything through and only the
          panels in it take a pointer. */}
      {panelsVisible && (
      <aside
        className="pointer-events-none absolute right-0 top-0 z-30 flex h-full w-full max-w-sm flex-col gap-3 overflow-hidden p-3 pt-20 sm:p-5 sm:pt-20"
      >
        {/* The reading matter scrolls. The runner is tall and used to push
            everything below it off the bottom of the column, which is what
            squeezed the console into a slit and left the whole column
            scrolling as one long strip. */}
        <div className="scroll-quiet flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto [&>*]:pointer-events-auto">
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
      )}

    </div>
  );
}
