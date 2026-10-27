"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { fetchJson, jsonBody } from "@/lib/client-api";
import { getPlayer } from "@/lib/player/store";
import type { Track } from "@/lib/types";
import { IconChevronDown, IconEdit, IconPlay, IconShuffle, IconTrash } from "./icons";
import { useLibrary } from "./LibraryProvider";
import { Sheet } from "./Sheet";
import { TrackList } from "./TrackList";
import { Mosaic } from "./PlaylistsView";

function shuffled<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function PlaylistDetail({ id }: { id: string }) {
  const router = useRouter();
  const { refreshPlaylists, toast } = useLibrary();
  const [name, setName] = useState("");
  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    fetchJson<{ playlist: { name: string }; tracks: Track[] }>(`/api/playlists/${id}`)
      .then((r) => {
        setName(r.playlist.name);
        setTracks(r.tracks);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load playlist."));
  }, [id]);

  const removeTrack = useCallback(
    async (track: Track) => {
      try {
        await fetchJson(`/api/playlists/${id}/tracks/${encodeURIComponent(track.key)}`, { method: "DELETE" });
        setTracks((prev) => prev?.filter((t) => t.key !== track.key) ?? prev);
        refreshPlaylists().catch(() => undefined);
        toast("Removed from playlist");
      } catch (err) {
        toast(err instanceof Error ? err.message : "Could not remove track");
      }
    },
    [id, refreshPlaylists, toast],
  );

  async function rename(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    try {
      await fetchJson(`/api/playlists/${id}`, { method: "PATCH", ...jsonBody({ name: draft.trim() }) });
      setName(draft.trim());
      setEditing(false);
      refreshPlaylists().catch(() => undefined);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not rename playlist");
    }
  }

  async function remove() {
    try {
      await fetchJson(`/api/playlists/${id}`, { method: "DELETE" });
      await refreshPlaylists();
      router.replace("/playlists");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not delete playlist");
    }
  }

  if (error) {
    return (
      <div className="pt-8 text-center">
        <p className="text-muted">{error}</p>
        <button type="button" className="btn-ghost mt-4" onClick={() => router.replace("/playlists")}>
          Back to playlists
        </button>
      </div>
    );
  }

  const context = { label: name };
  const play = (shuffle: boolean) => {
    if (!tracks?.length) return;
    getPlayer().playQueue(shuffle ? shuffled(tracks) : tracks, 0, { label: shuffle ? `${name} (shuffled)` : name });
  };

  return (
    <div className="space-y-5">
      <div className="pt-4">
        <button type="button" onClick={() => router.back()} aria-label="Back" className="grid size-11 place-items-center rounded-full border border-fg/20">
          <IconChevronDown size={22} className="rotate-90" />
        </button>
      </div>

      <header className="flex items-center gap-4">
        <Mosaic artwork={tracks?.map((t) => t.artwork).filter((a): a is string => Boolean(a)).slice(0, 4) ?? []} size={96} />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight [overflow-wrap:anywhere]">{name || "…"}</h1>
          <p className="mt-1 text-muted">{tracks ? `${tracks.length} ${tracks.length === 1 ? "track" : "tracks"}` : "Loading…"}</p>
        </div>
      </header>

      <div className="flex gap-2">
        <button type="button" onClick={() => play(false)} disabled={!tracks?.length} className="btn-accent flex-1">
          <IconPlay size={18} /> Play
        </button>
        <button type="button" onClick={() => play(true)} disabled={!tracks?.length} className="btn-ghost flex-1">
          <IconShuffle size={18} /> Shuffle
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(name);
            setEditing(true);
          }}
          aria-label="Rename playlist"
          className="btn-ghost !px-0 size-12"
        >
          <IconEdit size={20} />
        </button>
        <button type="button" onClick={() => setConfirmDelete(true)} aria-label="Delete playlist" className="btn-ghost !px-0 size-12">
          <IconTrash size={20} />
        </button>
      </div>

      {tracks && tracks.length === 0 && (
        <p className="rounded-2xl bg-fg/[0.06] px-4 py-8 text-center text-muted">
          Empty folder. Search for music and use the ⋯ menu on any track to add it here.
        </p>
      )}
      {tracks && tracks.length > 0 && <TrackList tracks={tracks} context={context} onRemove={removeTrack} removeLabel="Remove from this playlist" />}

      <Sheet open={editing} onClose={() => setEditing(false)} title="Rename playlist">
        <form onSubmit={rename} className="space-y-3">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={60} className="field !bg-card-fg/10 !border-card-fg/20 !text-card-fg" aria-label="Playlist name" autoFocus />
          <button type="submit" disabled={!draft.trim()} className="btn-accent w-full">
            Save
          </button>
        </form>
      </Sheet>

      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this playlist?">
        <p className="mb-4 text-card-muted">“{name}” and its track list will be permanently removed. Your liked tracks are not affected.</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setConfirmDelete(false)} className="btn-ghost flex-1 !border-card-fg/30 !text-card-fg">
            Cancel
          </button>
          <button type="button" onClick={remove} className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-red-500 font-semibold text-white">
            Delete
          </button>
        </div>
      </Sheet>
    </div>
  );
}
