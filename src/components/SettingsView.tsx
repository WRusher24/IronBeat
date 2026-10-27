"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { fetchJson, jsonBody } from "@/lib/client-api";
import { THEMES } from "@/lib/themes";
import type { SourceStatus } from "@/lib/types";
import { IconCheck, IconLogout } from "./icons";
import { useLibrary } from "./LibraryProvider";
import { PageHeader } from "./PageHeader";
import { useTheme } from "./ThemeProvider";
import { Swatch } from "./ThemeSwitcher";
import { useUser } from "./UserProvider";

export function SettingsView() {
  const router = useRouter();
  const user = useUser();
  const { theme, setTheme } = useTheme();
  const { toast } = useLibrary();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [sources, setSources] = useState<SourceStatus[] | null>(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    fetchJson<{ sources: SourceStatus[] }>("/api/sources")
      .then((r) => setSources(r.sources))
      .catch(() => setSources([]));
  }, []);

  async function saveName(e: FormEvent) {
    e.preventDefault();
    try {
      await fetchJson("/api/settings", { method: "PATCH", ...jsonBody({ displayName }) });
      toast("Name updated");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not save");
    }
  }

  async function clearHistory() {
    setClearing(true);
    try {
      await fetchJson("/api/history", { method: "DELETE" });
      toast("Search history cleared");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not clear history");
    } finally {
      setClearing(false);
    }
  }

  async function signOut() {
    await fetchJson("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    window.location.href = "/login";
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Settings" subtitle={user.email} />

      <section aria-labelledby="theme-heading">
        <h2 id="theme-heading" className="mb-3 px-1 text-xs font-semibold uppercase tracking-widest text-muted">
          Theme
        </h2>
        <div role="radiogroup" aria-label="Theme" className="space-y-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={theme === t.id}
              onClick={() => setTheme(t.id)}
              className={`card-surface flex min-h-[72px] w-full items-center gap-4 p-4 text-left transition active:scale-[0.98] ${theme === t.id ? "ring-2 ring-accent" : ""}`}
            >
              <Swatch id={t.id} size={40} />
              <span className="flex-1">
                <span className="block font-display text-base font-bold">{t.name}</span>
                <span className="block text-sm text-card-muted">{t.description}</span>
              </span>
              {theme === t.id && <IconCheck size={22} className="text-accent" />}
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="profile-heading">
        <h2 id="profile-heading" className="mb-3 px-1 text-xs font-semibold uppercase tracking-widest text-muted">
          Profile
        </h2>
        <form onSubmit={saveName} className="flex gap-2">
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} aria-label="Display name" className="field" />
          <button type="submit" disabled={!displayName.trim() || displayName.trim() === user.displayName} className="btn-accent shrink-0">
            Save
          </button>
        </form>
      </section>

      <section aria-labelledby="sources-heading">
        <h2 id="sources-heading" className="mb-3 px-1 text-xs font-semibold uppercase tracking-widest text-muted">
          Audio sources
        </h2>
        <ul className="card-surface divide-y divide-card-fg/10 px-4">
          {(sources ?? []).map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-3">
              <span className={`size-2.5 shrink-0 rounded-full ${s.enabled ? "bg-green-500" : "bg-card-muted/50"}`} aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{s.name}</span>
                <span className="block text-sm text-card-muted">{s.enabled ? "Active" : s.note}</span>
              </span>
              <span className="sr-only">{s.enabled ? "enabled" : "disabled"}</span>
            </li>
          ))}
          {sources === null && <li className="py-4 text-sm text-card-muted">Loading…</li>}
        </ul>
      </section>

      <section className="space-y-2">
        <button type="button" onClick={clearHistory} disabled={clearing} className="btn-ghost w-full">
          Clear search history
        </button>
        <button type="button" onClick={signOut} className="btn-ghost w-full">
          <IconLogout size={20} /> Sign out
        </button>
      </section>
    </div>
  );
}
