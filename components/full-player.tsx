"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Heart, ListPlus, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import { usePlayer } from "@/components/player-provider";
import { useLibrary } from "@/components/library-provider";
import { Spinner, Thumb } from "@/components/ui";

export function FullPlayer() {
  const player = usePlayer();
  const { isFavorite, toggleFavorite, openAddSheet } = useLibrary();
  const { current, expanded, showVideoAt } = player;
  const slotRef = useRef<HTMLDivElement>(null);
  const [scrubbing, setScrubbing] = useState<number | null>(null);

  const isVideo = current?.source === "youtube";

  // Keep the YouTube player glued to the video slot while the sheet is open.
  useEffect(() => {
    if (!expanded || !isVideo) {
      showVideoAt(null);
      return;
    }
    const place = () => {
      if (slotRef.current) showVideoAt(slotRef.current.getBoundingClientRect());
    };
    place();
    const timer = window.setTimeout(place, 320); // after the slide-up animation settles
    window.addEventListener("resize", place);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", place);
      showVideoAt(null);
    };
  }, [expanded, isVideo, showVideoAt, current?.id]);

  if (!expanded || !current) return null;

  const { playing, buffering, position, duration, shuffleOn, repeat, queue, index } = player;
  const shown = scrubbing ?? position;
  const favorite = isFavorite(current);

  return (
    <div className="fixed inset-0 z-[75] flex animate-sheet flex-col overflow-y-auto bg-bg px-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-[calc(env(safe-area-inset-top)+0.75rem)]">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => player.setExpanded(false)}
          aria-label="Close player"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-card text-card-fg"
        >
          <ChevronDown className="h-6 w-6" />
        </button>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Now playing</p>
        <span className="h-11 w-11" />
      </div>

      <div ref={slotRef} className="mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-4xl bg-card shadow-xl">
        {!isVideo && <Thumb src={current.thumbnail} className="h-full w-full" />}
      </div>

      <div className="mx-auto mt-6 flex w-full max-w-sm items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="line-clamp-2 text-xl font-extrabold leading-tight">{current.title}</h2>
          <p className="mt-1 truncate text-sm text-muted">{current.artist}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={() => toggleFavorite(current)}
            aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
            className="flex h-11 w-11 items-center justify-center rounded-full"
          >
            <Heart className={cn("h-6 w-6", favorite ? "fill-danger text-danger" : "text-muted")} />
          </button>
          <button
            onClick={() => openAddSheet(current)}
            aria-label="Add to training folder"
            className="flex h-11 w-11 items-center justify-center rounded-full"
          >
            <ListPlus className="h-6 w-6 text-muted" />
          </button>
        </div>
      </div>

      <div className="mx-auto mt-5 w-full max-w-sm">
        <input
          type="range"
          min={0}
          max={Math.max(duration, 1)}
          step={1}
          value={Math.min(shown, Math.max(duration, 1))}
          onChange={(e) => setScrubbing(Number(e.target.value))}
          onPointerUp={() => {
            if (scrubbing !== null) player.seek(scrubbing);
            setScrubbing(null);
          }}
          onKeyUp={() => {
            if (scrubbing !== null) player.seek(scrubbing);
            setScrubbing(null);
          }}
          aria-label="Seek"
          className="h-8 w-full cursor-pointer"
          style={{ accentColor: "rgb(var(--card))" }}
        />
        <div className="flex justify-between text-xs tabular-nums text-muted">
          <span>{formatTime(shown)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="mx-auto mt-3 flex w-full max-w-sm items-center justify-between">
        <button
          onClick={player.toggleShuffle}
          aria-label="Shuffle"
          aria-pressed={shuffleOn}
          className={cn("flex h-12 w-12 items-center justify-center rounded-full", shuffleOn ? "bg-accent text-accent-fg" : "text-muted")}
        >
          <Shuffle className="h-5 w-5" />
        </button>
        <button onClick={player.previous} aria-label="Previous" className="flex h-14 w-14 items-center justify-center">
          <SkipBack className="h-8 w-8 fill-current" />
        </button>
        <button
          onClick={player.toggle}
          aria-label={playing ? "Pause" : "Play"}
          className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-card text-card-fg shadow-lg active:scale-95"
        >
          {buffering && !playing ? <Spinner className="h-7 w-7" /> : playing ? <Pause className="h-8 w-8 fill-current" /> : <Play className="h-8 w-8 fill-current" />}
        </button>
        <button onClick={player.next} aria-label="Next" className="flex h-14 w-14 items-center justify-center">
          <SkipForward className="h-8 w-8 fill-current" />
        </button>
        <button
          onClick={player.cycleRepeat}
          aria-label={`Repeat ${repeat}`}
          className={cn("flex h-12 w-12 items-center justify-center rounded-full", repeat !== "off" ? "bg-accent text-accent-fg" : "text-muted")}
        >
          {repeat === "one" ? <Repeat1 className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}
        </button>
      </div>

      {queue.length > 1 && (
        <div className="mx-auto mt-8 w-full max-w-sm">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-widest text-muted">Up next</h3>
          <ul className="space-y-1">
            {queue.slice(index + 1, index + 11).map((track, i) => (
              <li key={`${track.id}-${i}`}>
                <button
                  onClick={() => player.jumpTo(index + 1 + i)}
                  className="flex min-h-14 w-full items-center gap-3 rounded-2xl text-left active:opacity-70"
                >
                  <Thumb src={track.thumbnail} className="h-11 w-11 rounded-xl" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{track.title}</span>
                    <span className="block truncate text-xs text-muted">{track.artist}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
