"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { fetchJson } from "@/lib/client-api";
import { MOODS, pickQuery, type Mood } from "@/lib/moods";
import { getPlayer } from "@/lib/player/store";
import { IconChevronRight, IconShuffle } from "./icons";
import { MoodGrid } from "./MoodGrid";
import { RecentChips } from "./RecentChips";
import { Results } from "./Results";
import { SearchHero } from "./SearchHero";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { useLaunch } from "./useLaunch";
import { useUser } from "./UserProvider";

export function HomeView() {
  const user = useUser();
  const [history, setHistory] = useState<{ query: string; count: number }[] | null>(null);
  const [activeMood, setActiveMood] = useState<string | null>(null);

  const loadHistory = useCallback(() => {
    fetchJson<{ history: { query: string; count: number }[] }>("/api/history")
      .then((r) => setHistory(r.history))
      .catch(() => setHistory([]));
  }, []);
  useEffect(loadHistory, [loadHistory]);

  const launcher = useLaunch(loadHistory);
  const { launch } = launcher;

  const searchAndPlay = (q: string) => {
    setActiveMood(null);
    void launch(q, { record: true });
  };
  const launchMood = (mood: Mood) => {
    setActiveMood(mood.id);
    void launch(pickQuery(mood), { record: false, label: `${mood.emoji} ${mood.title}` });
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between pt-5">
        <div>
          <p className="text-sm text-muted">Let&apos;s get after it,</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{user.displayName.split(" ")[0]}</h1>
        </div>
        <ThemeSwitcher />
      </header>

      <SearchHero busy={launcher.busy} initialQuery={!activeMood ? (launcher.query ?? "") : ""} onSearch={searchAndPlay} />

      <RecentChips history={history} activeQuery={activeMood ? null : launcher.query} disabled={launcher.busy} onLaunch={searchAndPlay} />

      <Results state={launcher} />

      <section aria-label="Moods">
        <div className="mb-3 flex items-end justify-between px-1">
          <h2 className="font-display text-xl font-extrabold">Vibe deck</h2>
          <Link href="/moods" className="flex items-center gap-0.5 text-sm font-semibold text-muted">
            All moods <IconChevronRight size={16} />
          </Link>
        </div>
        <MoodGrid moods={MOODS.slice(0, 4)} activeId={activeMood} disabled={launcher.busy} onLaunch={launchMood} />
      </section>

      <SmartShuffleCard />
    </div>
  );
}

export function SmartShuffleCard() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    getPlayer().unlock();
    setBusy(true);
    setError(null);
    try {
      const mix = await fetchJson<{ tracks: import("@/lib/types").Track[]; basedOn: string[] }>("/api/smart-shuffle");
      getPlayer().playQueue(mix.tracks, 0, { label: "Smart Shuffle" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build your mix.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="flex min-h-20 w-full items-center gap-4 rounded-3xl bg-accent p-4 text-left text-accent-fg active:scale-[0.98] transition disabled:opacity-70"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent-fg/15">
          <IconShuffle size={24} />
        </span>
        <span className="flex-1">
          <span className="block font-display text-lg font-extrabold leading-tight">Smart Shuffle</span>
          <span className="block text-sm opacity-80">{busy ? "Building your mix…" : "A mix from your top searches and liked tracks"}</span>
        </span>
      </button>
      {error && (
        <p role="alert" className="mt-2 px-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
