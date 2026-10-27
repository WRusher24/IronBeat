"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import type { Track } from "@/lib/types";
import { Button, Sheet, Thumb } from "@/components/ui";
import { useLibrary } from "@/components/library-provider";
import { useToast } from "@/components/toast";

export function AddToPlaylistSheet({ track, onClose }: { track: Track | null; onClose: () => void }) {
  const { playlists, createPlaylist, addToPlaylist } = useLibrary();
  const { notify } = useToast();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function add(playlistId: string, playlistName: string) {
    if (!track) return;
    setBusy(playlistId);
    const added = await addToPlaylist(playlistId, track);
    setBusy(null);
    notify(added ? `Added to ${playlistName}` : `Already in ${playlistName}`);
    onClose();
  }

  async function createAndAdd(event: React.FormEvent) {
    event.preventDefault();
    if (!track || !name.trim()) return;
    setBusy("new");
    try {
      const playlist = await createPlaylist(name.trim());
      setName("");
      await add(playlist.id, playlist.name);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Could not create the folder.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Sheet open={track !== null} onClose={onClose} title="Add to training folder">
      {track && (
        <>
          <div className="mb-4 flex items-center gap-3 rounded-2xl bg-card p-3 text-card-fg">
            <Thumb src={track.thumbnail} className="h-12 w-12 rounded-xl" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{track.title}</p>
              <p className="truncate text-xs text-card-muted">{track.artist}</p>
            </div>
          </div>

          <form onSubmit={createAndAdd} className="mb-4 flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New folder, e.g. Leg Day"
              maxLength={60}
              className="min-h-12 flex-1 rounded-2xl border border-line bg-transparent px-4 text-[16px] outline-none focus:border-accent"
            />
            <Button type="submit" loading={busy === "new"} disabled={!name.trim()} aria-label="Create folder and add">
              <Plus className="h-5 w-5" />
            </Button>
          </form>

          <ul className="space-y-2">
            {playlists.length === 0 && (
              <li className="py-4 text-center text-sm text-muted">No folders yet – create your first one above.</li>
            )}
            {playlists.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => add(p.id, p.name)}
                  disabled={busy !== null}
                  className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-line px-4 text-left active:bg-card/10 disabled:opacity-50"
                >
                  <span className="font-semibold">{p.name}</span>
                  <span className="flex items-center gap-2 text-xs text-muted">
                    {p.trackCount} tracks {busy === p.id && <Check className="h-4 w-4" />}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Sheet>
  );
}
