"use client";

import { useEffect, useState } from "react";
import { Play, Shuffle } from "lucide-react";
import { api } from "@/lib/client-api";
import type { Track } from "@/lib/types";
import { shuffle } from "@/lib/utils";
import { usePlayer } from "@/components/player-provider";
import { useLibrary } from "@/components/library-provider";
import { TrackList } from "@/components/track-list";
import { Button, Spinner } from "@/components/ui";

export function FavoritesView() {
  const player = usePlayer();
  const { favoriteIds } = useLibrary();
  const [tracks, setTracks] = useState<Track[] | null>(null);

  useEffect(() => {
    api<{ tracks: Track[] }>("/api/favorites")
      .then((data) => setTracks(data.tracks))
      .catch(() => setTracks([]));
  }, []);

  // Un-liking a row removes it from the list the next time it changes.
  const visible = tracks?.filter((t) => favoriteIds.has(t.id)) ?? null;

  if (visible === null) return <Spinner className="mx-auto mt-16 h-8 w-8" />;
  if (visible.length === 0) {
    return (
      <p className="mt-10 rounded-3xl border border-dashed border-line p-8 text-center text-sm text-muted">
        Tap the heart on any track and it lands here – your personal gym-hits list.
      </p>
    );
  }

  return (
    <>
      <div className="mb-3 flex gap-3">
        <Button className="flex-1" onClick={() => { player.prime(); player.playTracks(visible, 0); }}>
          <Play className="h-5 w-5 fill-current" /> Play
        </Button>
        <Button variant="dark" className="flex-1" onClick={() => { player.prime(); player.playTracks(shuffle(visible), 0); }}>
          <Shuffle className="h-5 w-5" /> Shuffle
        </Button>
      </div>
      <TrackList tracks={visible} onPlay={(i) => { player.prime(); player.playTracks(visible, i); }} />
    </>
  );
}
