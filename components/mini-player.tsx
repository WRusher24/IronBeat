"use client";

import { Pause, Play, SkipForward } from "lucide-react";
import { usePlayer } from "@/components/player-provider";
import { Spinner, Thumb } from "@/components/ui";

export function MiniPlayer() {
  const { current, playing, buffering, toggle, next, position, duration, setExpanded } = usePlayer();
  if (!current) return null;
  const progress = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;

  return (
    <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-40 px-3">
      <div className="relative mx-auto flex max-w-xl items-center gap-3 overflow-hidden rounded-3xl bg-card p-2 pr-2 text-card-fg shadow-xl">
        <button
          onClick={() => setExpanded(true)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-label="Open full player"
        >
          <Thumb src={current.thumbnail} className="h-12 w-12 rounded-2xl" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{current.title}</span>
            <span className="block truncate text-xs text-card-muted">{current.artist || "IronBeat"}</span>
          </span>
        </button>
        <button
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg active:scale-95"
        >
          {buffering && !playing ? (
            <Spinner />
          ) : playing ? (
            <Pause className="h-6 w-6 fill-current" />
          ) : (
            <Play className="h-6 w-6 fill-current" />
          )}
        </button>
        <button
          onClick={next}
          aria-label="Next track"
          className="flex h-12 w-11 shrink-0 items-center justify-center rounded-full active:scale-95"
        >
          <SkipForward className="h-6 w-6 fill-current" />
        </button>
        <div className="absolute inset-x-4 bottom-0 h-[3px] overflow-hidden rounded-full bg-card-fg/10">
          <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
