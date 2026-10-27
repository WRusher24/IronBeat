"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { fetchJson, jsonBody } from "@/lib/client-api";
import { getPlayer } from "@/lib/player/store";
import type { Playlist, Track } from "@/lib/types";
import { Artwork } from "./Artwork";
import { IconHeart, IconPlus, IconQueue, IconTrash } from "./icons";
import { Sheet } from "./Sheet";

interface MenuOptions {
  onRemove?: () => void;
  removeLabel?: string;
}

interface LibraryContextValue {
  favoriteKeys: Set<string>;
  isFavorite: (key: string) => boolean;
  toggleFavorite: (track: Track) => Promise<void>;
  playlists: Playlist[];
  refreshPlaylists: () => Promise<void>;
  createPlaylist: (name: string) => Promise<Playlist>;
  addToPlaylist: (playlistId: string, track: Track) => Promise<void>;
  openTrackMenu: (track: Track, options?: MenuOptions) => void;
  toast: (message: string) => void;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used inside LibraryProvider");
  return ctx;
}

const trackPayload = (t: Track) => ({
  source: t.source,
  sourceId: t.sourceId,
  title: t.title,
  artist: t.artist,
  artwork: t.artwork,
  duration: t.duration != null ? Math.round(t.duration) : null,
});

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [favoriteKeys, setFavoriteKeys] = useState<Set<string>>(new Set());
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [menu, setMenu] = useState<{ track: Track; options?: MenuOptions } | null>(null);
  const [pickerTrack, setPickerTrack] = useState<Track | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((text: string) => {
    setMessage(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setMessage(null), 2400);
  }, []);

  const refreshPlaylists = useCallback(async () => {
    const res = await fetchJson<{ playlists: Playlist[] }>("/api/playlists");
    setPlaylists(res.playlists);
  }, []);

  useEffect(() => {
    fetchJson<{ tracks: Track[] }>("/api/favorites")
      .then((r) => setFavoriteKeys(new Set(r.tracks.map((t) => t.key))))
      .catch(() => undefined);
    refreshPlaylists().catch(() => undefined);
  }, [refreshPlaylists]);

  const toggleFavorite = useCallback(
    async (track: Track) => {
      const was = favoriteKeys.has(track.key);
      const apply = (on: boolean) =>
        setFavoriteKeys((prev) => {
          const next = new Set(prev);
          if (on) next.add(track.key);
          else next.delete(track.key);
          return next;
        });
      apply(!was);
      try {
        if (was) await fetchJson(`/api/favorites?key=${encodeURIComponent(track.key)}`, { method: "DELETE" });
        else await fetchJson("/api/favorites", { method: "POST", ...jsonBody(trackPayload(track)) });
        toast(was ? "Removed from liked tracks" : "Added to liked tracks");
      } catch (err) {
        apply(was);
        toast(err instanceof Error ? err.message : "Could not update favorites");
      }
    },
    [favoriteKeys, toast],
  );

  const createPlaylist = useCallback(
    async (name: string) => {
      const res = await fetchJson<{ playlist: Playlist }>("/api/playlists", { method: "POST", ...jsonBody({ name }) });
      setPlaylists((prev) => [res.playlist, ...prev]);
      return res.playlist;
    },
    [],
  );

  const addToPlaylist = useCallback(
    async (playlistId: string, track: Track) => {
      try {
        const res = await fetchJson<{ added: boolean }>(`/api/playlists/${playlistId}/tracks`, {
          method: "POST",
          ...jsonBody(trackPayload(track)),
        });
        toast(res.added ? "Added to playlist" : "Already in that playlist");
        refreshPlaylists().catch(() => undefined);
      } catch (err) {
        toast(err instanceof Error ? err.message : "Could not add track");
      }
    },
    [refreshPlaylists, toast],
  );

  const openTrackMenu = useCallback((track: Track, options?: MenuOptions) => setMenu({ track, options }), []);

  const value = useMemo<LibraryContextValue>(
    () => ({
      favoriteKeys,
      isFavorite: (key) => favoriteKeys.has(key),
      toggleFavorite,
      playlists,
      refreshPlaylists,
      createPlaylist,
      addToPlaylist,
      openTrackMenu,
      toast,
    }),
    [favoriteKeys, toggleFavorite, playlists, refreshPlaylists, createPlaylist, addToPlaylist, openTrackMenu, toast],
  );

  return (
    <LibraryContext.Provider value={value}>
      {children}

      <Sheet open={Boolean(menu)} onClose={() => setMenu(null)} title="Track options">
        {menu && (
          <div>
            <div className="mb-3 flex items-center gap-3 rounded-2xl bg-card-fg/10 p-3">
              <Artwork src={menu.track.artwork} size={48} className="rounded-xl" />
              <div className="min-w-0">
                <p className="truncate font-semibold">{menu.track.title}</p>
                <p className="truncate text-sm text-card-muted">{menu.track.artist}</p>
              </div>
            </div>
            <MenuButton
              icon={<IconHeart size={20} filled={favoriteKeys.has(menu.track.key)} className={favoriteKeys.has(menu.track.key) ? "text-accent" : ""} />}
              label={favoriteKeys.has(menu.track.key) ? "Remove from liked tracks" : "Add to liked tracks"}
              onClick={() => {
                void toggleFavorite(menu.track);
                setMenu(null);
              }}
            />
            <MenuButton
              icon={<IconPlus size={20} />}
              label="Add to playlist"
              onClick={() => {
                setPickerTrack(menu.track);
                setMenu(null);
              }}
            />
            <MenuButton
              icon={<IconQueue size={20} />}
              label="Play next"
              onClick={() => {
                getPlayer().enqueue(menu.track, true);
                toast("Playing next");
                setMenu(null);
              }}
            />
            <MenuButton
              icon={<IconQueue size={20} />}
              label="Add to queue"
              onClick={() => {
                getPlayer().enqueue(menu.track);
                toast("Added to queue");
                setMenu(null);
              }}
            />
            {menu.options?.onRemove && (
              <MenuButton
                icon={<IconTrash size={20} />}
                label={menu.options.removeLabel ?? "Remove"}
                danger
                onClick={() => {
                  menu.options?.onRemove?.();
                  setMenu(null);
                }}
              />
            )}
          </div>
        )}
      </Sheet>

      <PlaylistPicker
        track={pickerTrack}
        playlists={playlists}
        onClose={() => setPickerTrack(null)}
        onPick={async (id, track) => {
          setPickerTrack(null);
          await addToPlaylist(id, track);
        }}
        onCreate={async (name, track) => {
          try {
            const p = await createPlaylist(name);
            setPickerTrack(null);
            await addToPlaylist(p.id, track);
          } catch (err) {
            toast(err instanceof Error ? err.message : "Could not create playlist");
          }
        }}
      />

      {message && (
        <div
          role="status"
          className="fixed inset-x-0 bottom-[calc(10.5rem+env(safe-area-inset-bottom))] z-[90] mx-auto w-fit max-w-[85vw] animate-fade rounded-full bg-card px-5 py-3 text-sm font-medium text-card-fg shadow-xl ring-1 ring-card-fg/20"
        >
          {message}
        </div>
      )}
    </LibraryContext.Provider>
  );
}

function MenuButton({ icon, label, onClick, danger }: { icon: ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-14 w-full items-center gap-4 rounded-2xl px-3 text-left font-medium active:bg-card-fg/10 ${danger ? "text-red-400" : ""}`}
    >
      {icon}
      {label}
    </button>
  );
}

function PlaylistPicker({
  track,
  playlists,
  onClose,
  onPick,
  onCreate,
}: {
  track: Track | null;
  playlists: Playlist[];
  onClose: () => void;
  onPick: (id: string, track: Track) => void;
  onCreate: (name: string, track: Track) => void;
}) {
  const [name, setName] = useState("");
  useEffect(() => {
    if (!track) setName("");
  }, [track]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (track && name.trim()) onCreate(name.trim(), track);
  }

  return (
    <Sheet open={Boolean(track)} onClose={onClose} title="Add to playlist">
      {track && (
        <div>
          <form onSubmit={submit} className="mb-3 flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              placeholder="New training folder…"
              className="field !bg-card-fg/10 !border-card-fg/20 !text-card-fg placeholder:!text-card-muted"
            />
            <button type="submit" disabled={!name.trim()} className="btn-accent shrink-0 !px-4" aria-label="Create playlist and add track">
              <IconPlus size={20} />
            </button>
          </form>
          {playlists.length === 0 && <p className="py-4 text-center text-sm text-card-muted">No playlists yet. Name one above to get started.</p>}
          {playlists.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPick(p.id, track)}
              className="flex min-h-14 w-full items-center justify-between rounded-2xl px-3 text-left active:bg-card-fg/10"
            >
              <span className="truncate font-medium">{p.name}</span>
              <span className="ml-3 shrink-0 text-sm text-card-muted">{p.trackCount} tracks</span>
            </button>
          ))}
        </div>
      )}
    </Sheet>
  );
}
