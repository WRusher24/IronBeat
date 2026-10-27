"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/client-api";
import { getPlayer } from "@/lib/player/store";
import type { Track } from "@/lib/types";
import { IconPlay, IconShuffle } from "./icons";
import { useLibrary } from "./LibraryProvider";
import { PageHeader } from "./PageHeader";
import { TrackList } from "./TrackList";

export function FavoritesView() {
  const { favoriteKeys } = useLibrary();
  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<{ tracks: Track[] }>("/api/favorites")
      .then((r) => setTracks(r.tracks))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load liked tracks."));
  }, []);

  // Keep the list in sync when a track is un-liked from this very page.
  const visible = tracks?.filter((t) => favoriteKeys.has(t.key)) ?? null;

  const play = (shuffle: boolean) => {
    if (!visible?.length) return;
    const list = shuffle ? [...visible].sort(() => Math.random() - 0.5) : visible;
    getPlayer().playQueue(list, 0, { label: "Liked tracks" });
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Liked tracks" subtitle={visible ? `${visible.length} saved` : undefined} />
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {visible && visible.length > 0 && (
        <div className="flex gap-2">
          <button type="button" onClick={() => play(false)} className="btn-accent flex-1">
            <IconPlay size={18} /> Play
          </button>
          <button type="button" onClick={() => play(true)} className="btn-ghost flex-1">
            <IconShuffle size={18} /> Shuffle
          </button>
        </div>
      )}
      {visible && visible.length === 0 && (
        <p className="rounded-2xl bg-fg/[0.06] px-4 py-8 text-center text-muted">Tap the heart on any track to save it here.</p>
      )}
      {visible && visible.length > 0 && <TrackList tracks={visible} context={{ label: "Liked tracks" }} />}
    </div>
  );
}
