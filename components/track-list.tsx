"use client";

import { Heart, ListPlus } from "lucide-react";
import type { ReactNode } from "react";
import type { Track } from "@/lib/types";
import { cn, formatTime } from "@/lib/utils";
import { EqualizerBars, Thumb } from "@/components/ui";
import { useLibrary } from "@/components/library-provider";
import { usePlayer } from "@/components/player-provider";

interface TrackListProps {
  tracks: Track[];
  onPlay(index: number): void;
  /** Extra per-row control, e.g. a remove button inside a playlist. */
  renderExtra?(track: Track, index: number): ReactNode;
}

export function TrackList({ tracks, onPlay, renderExtra }: TrackListProps) {
  const { current, playing } = usePlayer();
  const { isFavorite, toggleFavorite, openAddSheet } = useLibrary();

  return (
    <ul className="divide-y divide-line/70">
      {tracks.map((track, index) => {
        const isCurrent = current?.id === track.id;
        const favorite = isFavorite(track);
        return (
          <li key={`${track.id}-${index}`} className="flex items-center gap-1 py-2">
            <button
              onClick={() => onPlay(index)}
              className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-2xl text-left active:opacity-70"
              aria-label={`Play ${track.title}`}
            >
              <Thumb src={track.thumbnail} className="h-14 w-14 rounded-xl" />
              <span className="min-w-0 flex-1">
                <span className={cn("block truncate text-[15px] font-semibold", isCurrent && "underline decoration-accent decoration-2 underline-offset-4")}>
                  {track.title}
                </span>
                <span className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                  {isCurrent && <EqualizerBars active={playing} />}
                  <span className="truncate">{track.artist || sourceLabel(track)}</span>
                  {track.durationSec ? <span className="shrink-0">· {formatTime(track.durationSec)}</span> : null}
                </span>
              </span>
            </button>
            <button
              onClick={() => toggleFavorite(track)}
              aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
              aria-pressed={favorite}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-card/10"
            >
              <Heart className={cn("h-5 w-5", favorite ? "fill-danger text-danger" : "text-muted")} />
            </button>
            <button
              onClick={() => openAddSheet(track)}
              aria-label="Add to training folder"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-card/10"
            >
              <ListPlus className="h-5 w-5 text-muted" />
            </button>
            {renderExtra?.(track, index)}
          </li>
        );
      })}
    </ul>
  );
}

function sourceLabel(track: Track): string {
  return { youtube: "YouTube", archive: "Internet Archive", openverse: "Openverse", jamendo: "Jamendo" }[track.source];
}
