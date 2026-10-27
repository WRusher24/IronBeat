"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, FolderPlus, Shuffle } from "lucide-react";
import { api } from "@/lib/client-api";
import type { Track } from "@/lib/types";
import { useLibrary } from "@/components/library-provider";
import { usePlayer } from "@/components/player-provider";
import { useToast } from "@/components/toast";
import { Button, Spinner, Thumb } from "@/components/ui";

export function PlaylistsView() {
  const { playlists, playlistsLoaded, createPlaylist } = useLibrary();
  const player = usePlayer();
  const { notify } = useToast();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  async function onCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await createPlaylist(name.trim());
      setName("");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Could not create the folder.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <button
        onClick={() =>
          void player.launch("Smart Shuffle", async () => {
            const data = await api<{ tracks: Track[] }>("/api/smart-shuffle");
            return data.tracks;
          })
        }
        disabled={player.launching !== null}
        className="mb-5 flex min-h-20 w-full items-center justify-between rounded-3xl bg-card p-5 text-left text-card-fg active:scale-[0.98] disabled:opacity-60"
      >
        <span>
          <span className="block text-lg font-extrabold">Smart Shuffle</span>
          <span className="block text-sm text-card-muted">Your favorites + most-searched genres, mixed live</span>
        </span>
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-fg">
          {player.launching === "Smart Shuffle" ? <Spinner /> : <Shuffle className="h-5 w-5" />}
        </span>
      </button>

      <form onSubmit={onCreate} className="mb-6 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New training folder, e.g. Push Day"
          maxLength={60}
          aria-label="Folder name"
          className="min-h-12 min-w-0 flex-1 rounded-2xl border border-line bg-transparent px-4 text-[16px] outline-none focus:border-fg"
        />
        <Button type="submit" loading={creating} disabled={!name.trim()} aria-label="Create folder">
          <FolderPlus className="h-5 w-5" />
          Create
        </Button>
      </form>

      {!playlistsLoaded ? (
        <Spinner className="mx-auto mt-10 h-8 w-8" />
      ) : playlists.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line p-8 text-center text-sm text-muted">
          No folders yet. Create “Leg Day”, “Cardio” or “Heavy Pull” – then add tracks from any search with the + button.
        </p>
      ) : (
        <ul className="space-y-3">
          {playlists.map((p) => (
            <li key={p.id}>
              <Link
                href={`/playlists/${p.id}`}
                className="flex min-h-20 items-center gap-4 rounded-3xl border border-line p-3 active:scale-[0.98]"
              >
                <div className="grid h-16 w-16 shrink-0 grid-cols-2 gap-0.5 overflow-hidden rounded-2xl bg-card">
                  {p.covers.length === 0 ? (
                    <span className="col-span-2 flex items-center justify-center text-2xl text-accent">♪</span>
                  ) : (
                    p.covers.slice(0, 4).map((cover, i) => <Thumb key={i} src={cover} className="h-full w-full" />)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{p.name}</p>
                  <p className="text-sm text-muted">
                    {p.trackCount} {p.trackCount === 1 ? "track" : "tracks"}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
