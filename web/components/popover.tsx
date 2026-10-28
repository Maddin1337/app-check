"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** A chip that opens a panel below it; closes on outside click or Escape. */
export function Popover({ icon, label: text, active = false, align = "left", children }: {
  icon: ReactNode; label: string; active?: boolean; align?: "left" | "right";
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <div ref={root} className="relative">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}
        className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors ${
          active ? "border-primary/40 bg-primary-soft text-primary" : "border-border bg-surface text-text hover:bg-surface-2"}`}>
        {icon}
        {text}
        <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className={`absolute top-11 z-30 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-surface-2 shadow-2xl shadow-black/60 ${
          align === "right" ? "right-0" : "left-0"}`}>
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  );
}

