"use client";

import { getPlayer, usePlayer, usePlayerTime } from "@/lib/player/store";
import { Artwork } from "./Artwork";
import { IconNext, IconPause, IconPlay } from "./icons";

export function MiniPlayer() {
  const player = usePlayer();
  const { currentTime, duration } = usePlayerTime();
  const track = player.current;
  if (!track) return null;

  const busy = player.status === "playing" || player.status === "loading";
  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const subtitle =
    player.status === "error" ? player.error ?? "Playback error" : player.status === "loading" ? "Loading…" : track.artist;

  return (
    <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 mx-auto w-full max-w-xl px-3">
      <div className="card-surface relative overflow-hidden shadow-2xl ring-1 ring-card-fg/10">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-card-fg/10" aria-hidden="true">
          <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center gap-1 p-2">
          <button
            type="button"
            onClick={() => getPlayer().setExpanded(true)}
            className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-2xl text-left"
            aria-label="Open full player"
          >
            <Artwork src={track.artwork} size={48} className="rounded-xl" />
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-semibold leading-tight">{track.title}</span>
              <span className="block truncate text-sm text-card-muted">{subtitle}</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => getPlayer().toggle()}
            aria-label={busy ? "Pause" : "Play"}
            className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-accent-fg active:scale-95 transition"
          >
            {busy ? <IconPause size={22} /> : <IconPlay size={22} />}
          </button>
          <button
            type="button"
            onClick={() => getPlayer().next()}
            aria-label="Next track"
            className="grid size-12 shrink-0 place-items-center rounded-full active:bg-card-fg/10"
          >
            <IconNext size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}
