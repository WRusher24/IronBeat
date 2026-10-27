"use client";

import { useEffect, type ReactNode } from "react";
import { IconClose } from "./icons";

export function Sheet({
  open,
  onClose,
  title,
  children,
  z = "z-[70]",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  z?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className={`fixed inset-0 ${z} flex items-end justify-center`} role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/55 animate-fade" onClick={onClose} />
      <div className="relative w-full max-w-xl animate-sheet-up rounded-t-4xl bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-card-fg shadow-2xl">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-card-fg/25" />
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-10 place-items-center rounded-full bg-card-fg/10">
            <IconClose size={18} />
          </button>
        </div>
        <div className="max-h-[65dvh] overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
}
