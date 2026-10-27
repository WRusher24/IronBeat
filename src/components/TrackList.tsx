"use client";

import { SOURCE_LABELS, formatTime } from "@/lib/format";
import { getPlayer, usePlayer, type PlayerContext } from "@/lib/player/store";
import type { Track } from "@/lib/types";
import { Artwork } from "./Artwork";
import { Equalizer, IconHeart, IconMore } from "./icons";
import { useLibrary } from "./LibraryProvider";

export function TrackList({
  tracks,
  context,
  onRemove,
  removeLabel,
}: {
  tracks: Track[];
  context: PlayerContext;
  onRemove?: (track: Track) => void;
  removeLabel?: string;
}) {
  const player = usePlayer();
  const { isFavorite, toggleFavorite, openTrackMenu } = useLibrary();

  return (
    <ul className="space-y-1">
      {tracks.map((track, i) => {
        const active = player.current?.key === track.key;
        const playing = active && player.status === "playing";
        const fav = isFavorite(track.key);
        return (
          <li key={track.key} className={`flex items-center gap-1 rounded-2xl pr-1 ${active ? "bg-fg/[0.07]" : ""}`}>
            <button
              type="button"
              onClick={() => (active ? getPlayer().toggle() : getPlayer().playQueue(tracks, i, context))}
              className="flex min-h-[64px] min-w-0 flex-1 items-center gap-3 rounded-2xl p-2 text-left active:bg-fg/10"
              aria-label={`${playing ? "Pause" : "Play"} ${track.title} by ${track.artist}`}
            >
              <span className="relative">
                <Artwork src={track.artwork} size={48} className="rounded-xl" />
                {active && (
                  <span className="absolute inset-0 grid place-items-center rounded-xl bg-black/50 text-white">
                    {playing ? <Equalizer /> : <span className="size-2 rounded-full bg-accent" />}
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block truncate font-semibold leading-tight ${active ? "text-fg" : ""}`}>{track.title}</span>
                <span className="mt-0.5 block truncate text-sm text-muted">
                  {track.artist}
                  <span className="mx-1.5 opacity-50">·</span>
                  {SOURCE_LABELS[track.source]}
                  {track.duration ? <span className="opacity-70"> · {formatTime(track.duration)}</span> : null}
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => void toggleFavorite(track)}
              aria-label={fav ? "Remove from liked tracks" : "Like track"}
              aria-pressed={fav}
              className="grid size-11 shrink-0 place-items-center rounded-full active:bg-fg/10"
            >
              <IconHeart size={20} filled={fav} className={fav ? "text-accent" : "text-muted"} />
            </button>
            <button
              type="button"
              onClick={() => openTrackMenu(track, onRemove ? { onRemove: () => onRemove(track), removeLabel } : undefined)}
              aria-label="More options"
              className="grid size-11 shrink-0 place-items-center rounded-full text-muted active:bg-fg/10"
            >
              <IconMore size={20} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
