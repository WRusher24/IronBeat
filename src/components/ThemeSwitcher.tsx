"use client";

import { useEffect, useRef, useState } from "react";
import { THEMES } from "@/lib/themes";
import { IconCheck, IconPalette } from "./icons";
import { useTheme } from "./ThemeProvider";

/** Compact dropdown for the header. */
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Change theme"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid size-11 place-items-center rounded-full border border-fg/20 active:scale-95 transition"
      >
        <IconPalette size={20} />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Theme"
          className="absolute right-0 top-14 z-40 w-64 overflow-hidden rounded-3xl bg-card p-2 text-card-fg shadow-2xl ring-1 ring-fg/10 animate-fade"
        >
          {THEMES.map((t) => (
            <li key={t.id} role="option" aria-selected={theme === t.id}>
              <button
                type="button"
                onClick={() => {
                  setTheme(t.id);
                  setOpen(false);
                }}
                className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 py-2 text-left active:bg-card-fg/10"
              >
                <Swatch id={t.id} />
                <span className="flex-1 text-sm font-medium">{t.name}</span>
                {theme === t.id && <IconCheck size={18} className="text-accent" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Swatch({ id, size = 32 }: { id: string; size?: number }) {
  const t = THEMES.find((x) => x.id === id) ?? THEMES[0];
  return (
    <span
      className="relative inline-block shrink-0 overflow-hidden rounded-full ring-1 ring-card-fg/30"
      style={{ width: size, height: size, background: t.swatch.bg }}
      aria-hidden="true"
    >
      <span className="absolute bottom-0 left-0 h-1/2 w-full" style={{ background: t.swatch.card }} />
      <span className="absolute right-0 top-0 size-1/2 rounded-bl-full" style={{ background: t.swatch.accent }} />
    </span>
  );
}
