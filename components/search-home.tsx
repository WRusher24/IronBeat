"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Shuffle, X } from "lucide-react";
import { api } from "@/lib/client-api";
import type { Track } from "@/lib/types";
import { MOODS } from "@/lib/moods";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/components/player-provider";
import { TrackList } from "@/components/track-list";
import { MoodCard } from "@/components/mood-card";
import { SectionTitle, Spinner } from "@/components/ui";

interface Chip {
  query: string;
  hits: number;
}

export function SearchHome({ displayName }: { displayName: string }) {
  const player = usePlayer();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [chips, setChips] = useState<Chip[]>([]);
  const [results, setResults] = useState<Track[] | null>(null);
  const [resultsQuery, setResultsQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const loadChips = useCallback(async () => {
    try {
      const data = await api<{ chips: Chip[] }>("/api/history");
      setChips(data.chips);
    } catch {
      /* chips are a convenience – ignore failures */
    }
  }, []);

  useEffect(() => {
    void loadChips();
  }, [loadChips]);

  /** One tap: prime audio, search, show results, autoplay the first track and queue the rest. */
  const runSearch = useCallback(
    async (rawQuery: string) => {
      const query = rawQuery.trim();
      if (!query) return;
      setValue(query);
      setSearching(true);
      inputRef.current?.blur();
      const tracks = await player.launch(query, async () => {
        const data = await api<{ tracks: Track[] }>(`/api/search?q=${encodeURIComponent(query)}`);
        return data.tracks;
      });
      setSearching(false);
      setResults(tracks);
      setResultsQuery(query);
      if (tracks.length > 0) void loadChips();
    },
    [player, loadChips],
  );

  async function smartShuffle() {
    const tracks = await player.launch("Smart Shuffle", async () => {
      const data = await api<{ tracks: Track[] }>("/api/smart-shuffle");
      return data.tracks;
    });
    if (tracks.length > 0) {
      setResults(tracks);
      setResultsQuery("Smart Shuffle");
    }
  }

  async function clearChips() {
    if (!confirm("Clear all quick-launch chips? Smart Shuffle will also forget your search history.")) return;
    setChips([]);
    await api("/api/history", { method: "DELETE" }).catch(() => undefined);
  }

  const busy = searching || player.launching !== null;

  return (
    <div>
      <p className="text-sm font-semibold text-muted">Hey {displayName.split(" ")[0]} 👋</p>
      <h1 className="mb-4 text-4xl font-black leading-[1.05] tracking-tight">What are we<br />lifting to?</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void runSearch(value);
        }}
        role="search"
        className="flex items-center gap-2 rounded-[1.75rem] bg-card p-2 pl-5 text-card-fg shadow-lg"
      >
        <Search className="h-5 w-5 shrink-0 text-card-muted" aria-hidden />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="workout nasheed, brazilian phonk…"
          aria-label="Search music"
          className="min-h-12 min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-card-muted"
        />
        {value && (
          <button type="button" onClick={() => setValue("")} aria-label="Clear" className="flex h-10 w-10 items-center justify-center rounded-full text-card-muted">
            <X className="h-5 w-5" />
          </button>
        )}
        <button
          type="submit"
          disabled={busy || !value.trim()}
          className="flex h-12 min-w-24 items-center justify-center gap-2 rounded-[1.25rem] bg-accent px-5 text-[15px] font-bold text-accent-fg active:scale-95 disabled:opacity-60"
        >
          {busy ? <Spinner className="h-5 w-5" /> : "Pump"}
        </button>
      </form>

      {chips.length > 0 && (
        <div className="-mx-4 mt-4">
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1" aria-label="Recent searches">
            {chips.map((chip) => (
              <span key={chip.query} className="shrink-0">
                <button
                  onClick={() => void runSearch(chip.query)}
                  disabled={busy}
                  className={cn(
                    "min-h-11 whitespace-nowrap rounded-full border border-line bg-bg px-4 text-sm font-semibold transition active:scale-95 disabled:opacity-50",
                    results && resultsQuery === chip.query && "border-fg bg-card text-card-fg",
                  )}
                >
                  {chip.query}
                </button>
              </span>
            ))}
          </div>
          <div className="mt-1 px-4">
            <button onClick={() => void clearChips()} className="text-xs text-muted underline underline-offset-2">
              Clear recent searches
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => void smartShuffle()}
        disabled={busy}
        className="mt-5 flex min-h-14 w-full items-center justify-between rounded-3xl border border-line px-5 text-left active:scale-[0.98] disabled:opacity-50"
      >
        <span>
          <span className="block font-bold">Smart Shuffle</span>
          <span className="block text-xs text-muted">A mix built from your favorites & top searches</span>
        </span>
        <Shuffle className="h-6 w-6" />
      </button>

      {results && (
        <section className="mt-8" aria-live="polite">
          <SectionTitle>{resultsQuery === "Smart Shuffle" ? "Smart Shuffle" : `Results for “${resultsQuery}”`}</SectionTitle>
          {results.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-line p-6 text-center text-sm text-muted">
              Nothing playable found. Try different words, e.g. “gym motivation”.
            </p>
          ) : (
            <TrackList tracks={results} onPlay={(i) => { player.prime(); player.playTracks(results, i); }} />
          )}
        </section>
      )}

      <section className="mt-8">
        <SectionTitle>Vibe deck</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {MOODS.map((mood) => (
            <MoodCard key={mood.id} mood={mood} />
          ))}
        </div>
      </section>
    </div>
  );
}
