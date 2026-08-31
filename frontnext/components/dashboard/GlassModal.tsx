"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { t } from "../../lib/i18n";
import { useLabStore } from "../../store/labStore";

interface GlassModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * The panel a sidebar icon opens.
 *
 * Escape closes it, focus is not trapped because nothing inside is a form that
 * would strand a keyboard user, and the backdrop is a blur rather than a black
 * sheet so the lab stays visible behind it.
 *
 * It renders through a portal on purpose. A fixed element is positioned
 * against its nearest transformed ancestor rather than the viewport, and the
 * icon rail that opens this is centred with a transform, which collapsed the
 * dialog into a sliver the width of the rail.
 */
export function GlassModal({ title, onClose, children }: GlassModalProps) {
  const uiLang = useLabStore((state) => state.uiLang);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label={t(uiLang, "close")}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-slate-950/45 backdrop-blur-sm"
      />
      <div className="glass-panel relative flex max-h-[82vh] w-full max-w-2xl flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] px-6 py-4">
          <h2 className="text-base font-medium tracking-wide text-slate-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-slate-400 transition hover:text-slate-100"
          >
            {t(uiLang, "close")}
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
