"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { THEMES, themeById, type ThemeId } from "@/lib/themes";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/toast";

function useTheme() {
  const { notify } = useToast();
  const [theme, setTheme] = useState<ThemeId>("warm");

  useEffect(() => {
    setTheme(themeById(document.documentElement.dataset.theme).id);
  }, []);

  async function choose(next: ThemeId) {
    const previous = theme;
    apply(next);
    setTheme(next);
    try {
      await api("/api/me/theme", { method: "PATCH", json: { theme: next } });
    } catch (err) {
      apply(previous);
      setTheme(previous);
      notify(err instanceof Error ? err.message : "Could not save your theme.");
    }
  }
  return { theme, choose };
}

function apply(id: ThemeId) {
  document.documentElement.dataset.theme = id;
  const color = themeById(id).background;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.remove());
  const meta = document.createElement("meta");
  meta.name = "theme-color";
  meta.content = color;
  document.head.appendChild(meta);
}

function Swatch({ id, className }: { id: ThemeId; className?: string }) {
  const t = themeById(id);
  return (
    <span
      className={cn("relative inline-block h-7 w-7 shrink-0 overflow-hidden rounded-full ring-1 ring-black/15", className)}
      style={{ background: t.background }}
      aria-hidden
    >
      <span className="absolute bottom-0 left-0 h-1/2 w-full" style={{ background: t.card }} />
      <span className="absolute right-0 top-0 h-1/2 w-1/2" style={{ background: t.accent }} />
    </span>
  );
}

/** Compact dropdown used in the app header. */
export function ThemeDropdown() {
  const { theme, choose } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change theme"
        className="flex h-11 items-center gap-1 rounded-full border border-line pl-2 pr-2.5 active:scale-95"
      >
        <Swatch id={theme} />
        <ChevronDown className={cn("h-4 w-4 text-muted transition", open && "rotate-180")} />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Themes"
          className="absolute right-0 z-[60] mt-2 w-64 animate-fade overflow-hidden rounded-3xl bg-card p-2 text-card-fg shadow-2xl"
        >
          {THEMES.map((t) => (
            <li key={t.id} role="option" aria-selected={t.id === theme}>
              <button
                onClick={() => {
                  void choose(t.id);
                  setOpen(false);
                }}
                className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 text-left active:bg-card-fg/10"
              >
                <Swatch id={t.id} className="ring-card-fg/30" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{t.name}</span>
                  <span className="block truncate text-xs text-card-muted">{t.description}</span>
                </span>
                {t.id === theme && <Check className="h-5 w-5 text-accent" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Large preview cards used on the Settings page. */
export function ThemePicker() {
  const { theme, choose } = useTheme();
  return (
    <div className="grid gap-3">
      {THEMES.map((t) => (
        <button
          key={t.id}
          onClick={() => void choose(t.id)}
          aria-pressed={t.id === theme}
          className={cn(
            "flex min-h-20 items-center gap-4 rounded-3xl border-2 p-3 text-left transition active:scale-[0.98]",
            t.id === theme ? "border-fg" : "border-line",
          )}
        >
          <span className="flex h-14 w-20 shrink-0 overflow-hidden rounded-2xl ring-1 ring-black/10" style={{ background: t.background }}>
            <span className="m-2 flex-1 rounded-lg" style={{ background: t.card }}>
              <span className="m-1.5 block h-2 w-8 rounded-full" style={{ background: t.accent }} />
            </span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">{t.name}</span>
            <span className="block text-sm text-muted">{t.description}</span>
          </span>
          {t.id === theme && <Check className="h-6 w-6 shrink-0" />}
        </button>
      ))}
    </div>
  );
}
