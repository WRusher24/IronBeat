"use client";

import { formatTime, SOURCE_LABELS } from "@/lib/format";
import { getPlayer, usePlayer, usePlayerTime } from "@/lib/player/store";
import { Artwork } from "./Artwork";
import {
  Equalizer,
  IconChevronDown,
  IconHeart,
  IconMore,
  IconNext,
  IconPause,
  IconPlay,
  IconPrev,
  IconRepeat,
  IconClose,
} from "./icons";
import { useLibrary } from "./LibraryProvider";

export function FullPlayer() {
  const player = usePlayer();
  const { currentTime, duration } = usePlayerTime();
  const { isFavorite, toggleFavorite, openTrackMenu } = useLibrary();
  const track = player.current;
  if (!player.expanded || !track) return null;

  const store = getPlayer();
  const busy = player.status === "playing" || player.status === "loading";
  const fav = isFavorite(track.key);
  const isYouTube = track.source === "youtube";
  const upNext = player.queue.map((t, i) => ({ t, i })).filter(({ i }) => i > player.index);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-bg animate-sheet-up" role="dialog" aria-modal="true" aria-label="Now playing">
      <div className="mx-auto flex h-full w-full max-w-xl flex-col overflow-y-auto px-5 pt-safe pb-safe">
        <header className="flex items-center justify-between py-3">
          <button type="button" onClick={() => store.setExpanded(false)} aria-label="Close player" className="grid size-11 place-items-center rounded-full border border-fg/20">
            <IconChevronDown size={22} />
          </button>
          <div className="min-w-0 px-3 text-center">
            <p className="text-xs uppercase tracking-widest text-muted">Playing from</p>
            <p className="truncate text-sm font-semibold">{player.context?.label ?? "IronBeat"}</p>
          </div>
          <button
            type="button"
            onClick={() => openTrackMenu(track)}
            aria-label="Track options"
            className="grid size-11 place-items-center rounded-full border border-fg/20"
          >
            <IconMore size={20} />
          </button>
        </header>

        {/* YouTube's player is mounted globally (AppShell) and floats over this slot. */}
        <div className="mx-auto mt-2 w-full max-w-[22rem] sm:max-w-md" style={isYouTube ? undefined : { width: "min(100%, 40dvh)" }}>
          {isYouTube ? (
            <div className="aspect-video w-full rounded-3xl bg-card/60" aria-hidden="true" />
          ) : (
            <Artwork src={track.artwork} className="aspect-square w-full rounded-4xl shadow-2xl" />
          )}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-2xl font-extrabold leading-tight">{track.title}</h2>
            <p className="mt-1 truncate text-muted">
              {track.artist} · {SOURCE_LABELS[track.source]}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void toggleFavorite(track)}
            aria-label={fav ? "Remove from liked tracks" : "Like track"}
            aria-pressed={fav}
            className="grid size-12 shrink-0 place-items-center rounded-full border border-fg/20"
          >
            <IconHeart size={22} filled={fav} className={fav ? "text-accent" : ""} />
          </button>
        </div>

        <div className="mt-5">
          <input
            type="range"
            min={0}
            max={Math.max(duration, 1)}
            step={1}
            value={Math.min(currentTime, Math.max(duration, 1))}
            disabled={!duration}
            onChange={(e) => store.seek(Number(e.target.value))}
            aria-label="Seek"
            className="h-8 w-full cursor-pointer accent-[rgb(var(--accent))] disabled:opacity-40"
          />
          <div className="-mt-1 flex justify-between text-xs tabular-nums text-muted">
            <span>{formatTime(currentTime)}</span>
            <span>{duration ? formatTime(duration) : "--:--"}</span>
          </div>
        </div>

        {player.status === "error" && player.error && (
          <p role="alert" className="mt-3 rounded-2xl bg-red-500/15 px-4 py-3 text-sm text-red-500">
            {player.error} Tap play to retry, or skip to the next track.
          </p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => store.cycleRepeat()}
            aria-label={`Repeat: ${player.repeat}`}
            className={`relative grid size-12 place-items-center rounded-full ${player.repeat === "off" ? "text-muted" : "text-accent"}`}
          >
            <IconRepeat size={22} />
            {player.repeat === "one" && <span className="absolute right-2.5 top-2 text-[10px] font-bold">1</span>}
          </button>
          <button type="button" onClick={() => store.prev()} aria-label="Previous track" className="grid size-14 place-items-center rounded-full active:bg-fg/10">
            <IconPrev size={30} />
          </button>
          <button
            type="button"
            onClick={() => store.toggle()}
            aria-label={busy ? "Pause" : "Play"}
            className="grid size-[72px] place-items-center rounded-full bg-accent text-accent-fg shadow-lg active:scale-95 transition"
          >
            {busy ? <IconPause size={32} /> : <IconPlay size={32} />}
          </button>
          <button type="button" onClick={() => store.next()} aria-label="Next track" className="grid size-14 place-items-center rounded-full active:bg-fg/10">
            <IconNext size={30} />
          </button>
          <span className="size-12" aria-hidden="true" />
        </div>

        <section className="mt-8 pb-6">
          <h3 className="mb-2 font-display text-lg font-bold">Up next</h3>
          {upNext.length === 0 ? (
            <p className="text-sm text-muted">Nothing queued. Search or launch a mood to keep the music going.</p>
          ) : (
            <ul className="space-y-1">
              {upNext.slice(0, 50).map(({ t, i }) => (
                <li key={`${t.key}-${i}`} className="flex items-center gap-1">
                  <button type="button" onClick={() => store.playFromQueue(i)} className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-2xl p-2 text-left active:bg-fg/10">
                    <Artwork src={t.artwork} size={44} className="rounded-xl" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{t.title}</span>
                      <span className="block truncate text-sm text-muted">{t.artist}</span>
                    </span>
                  </button>
                  <button type="button" onClick={() => store.removeFromQueue(i)} aria-label={`Remove ${t.title} from queue`} className="grid size-11 shrink-0 place-items-center rounded-full text-muted active:bg-fg/10">
                    <IconClose size={18} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        {player.status === "playing" && <Equalizer className="sr-only" />}
      </div>
    </div>
  );
}
