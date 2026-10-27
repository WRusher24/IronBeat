"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, Pencil, Play, Shuffle, Trash2, X } from "lucide-react";
import { api } from "@/lib/client-api";
import type { PlaylistDetail } from "@/lib/types";
import { shuffle } from "@/lib/utils";
import { useLibrary } from "@/components/library-provider";
import { usePlayer } from "@/components/player-provider";
import { useToast } from "@/components/toast";
import { TrackList } from "@/components/track-list";
import { Button, Spinner } from "@/components/ui";
import { ThemeDropdown } from "@/components/theme-switcher";

export function PlaylistDetailView({ id }: { id: string }) {
  const router = useRouter();
  const player = usePlayer();
  const { refreshPlaylists } = useLibrary();
  const { notify } = useToast();
  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [missing, setMissing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    api<{ playlist: PlaylistDetail }>(`/api/playlists/${id}`)
      .then((data) => {
        setPlaylist(data.playlist);
        setName(data.playlist.name);
      })
      .catch(() => setMissing(true));
  }, [id]);

  async function rename(event: React.FormEvent) {
    event.preventDefault();
    if (!playlist || !name.trim()) return;
    try {
      await api(`/api/playlists/${id}`, { method: "PATCH", json: { name: name.trim() } });
      setPlaylist({ ...playlist, name: name.trim() });
      setEditing(false);
      void refreshPlaylists();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Could not rename the folder.");
    }
  }

  async function remove() {
    if (!playlist || !confirm(`Delete “${playlist.name}”? The tracks themselves stay available in search.`)) return;
    try {
      await api(`/api/playlists/${id}`, { method: "DELETE" });
      await refreshPlaylists();
      router.replace("/playlists");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Could not delete the folder.");
    }
  }

  async function removeTrack(entryId: string) {
    if (!playlist) return;
    const previous = playlist;
    setPlaylist({ ...playlist, tracks: playlist.tracks.filter((t) => t.entryId !== entryId) });
    try {
      await api(`/api/playlists/${id}/tracks/${entryId}`, { method: "DELETE" });
      void refreshPlaylists();
    } catch (err) {
      setPlaylist(previous);
      notify(err instanceof Error ? err.message : "Could not remove the track.");
    }
  }

  if (missing) {
    return (
      <div className="pt-[calc(env(safe-area-inset-top)+3rem)] text-center">
        <p className="mb-4 text-muted">This folder doesn’t exist.</p>
        <Link href="/playlists" className="font-bold underline underline-offset-4">Back to folders</Link>
      </div>
    );
  }
  if (!playlist) return <Spinner className="mx-auto mt-24 h-8 w-8" />;

  const tracks = playlist.tracks;

  return (
    <>
      <header className="flex items-center justify-between pb-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <Link href="/playlists" aria-label="Back to folders" className="flex h-11 w-11 items-center justify-center rounded-full border border-line">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <ThemeDropdown />
      </header>

      {editing ? (
        <form onSubmit={rename} className="mb-4 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            autoFocus
            aria-label="Folder name"
            className="min-h-12 min-w-0 flex-1 rounded-2xl border border-line bg-transparent px-4 text-[16px] outline-none focus:border-fg"
          />
          <Button type="submit">Save</Button>
          <Button type="button" variant="ghost" onClick={() => setEditing(false)} aria-label="Cancel">
            <X className="h-5 w-5" />
          </Button>
        </form>
      ) : (
        <div className="mb-1 flex items-start justify-between gap-2">
          <h1 className="text-3xl font-black tracking-tight">{playlist.name}</h1>
          <div className="flex shrink-0 gap-1">
            <button onClick={() => setEditing(true)} aria-label="Rename folder" className="flex h-11 w-11 items-center justify-center rounded-full border border-line">
              <Pencil className="h-5 w-5" />
            </button>
            <button onClick={remove} aria-label="Delete folder" className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-danger">
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
      <p className="mb-4 text-sm text-muted">
        {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
      </p>

      {tracks.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line p-8 text-center text-sm text-muted">
          Empty folder. Search for music on Home and tap the + button on any track to add it here.
        </p>
      ) : (
        <>
          <div className="mb-3 flex gap-3">
            <Button className="flex-1" onClick={() => { player.prime(); player.playTracks(tracks, 0); }}>
              <Play className="h-5 w-5 fill-current" /> Play
            </Button>
            <Button variant="dark" className="flex-1" onClick={() => { player.prime(); player.playTracks(shuffle(tracks), 0); }}>
              <Shuffle className="h-5 w-5" /> Shuffle
            </Button>
          </div>
          <TrackList
            tracks={tracks}
            onPlay={(i) => { player.prime(); player.playTracks(tracks, i); }}
            renderExtra={(_, i) => (
              <button
                onClick={() => void removeTrack(tracks[i].entryId)}
                aria-label="Remove from folder"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-card/10"
              >
                <X className="h-5 w-5 text-muted" />
              </button>
            )}
          />
        </>
      )}
    </>
  );
}
