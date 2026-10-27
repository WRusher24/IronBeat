"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import type { Playlist } from "@/lib/types";
import { Artwork } from "./Artwork";
import { SmartShuffleCard } from "./HomeView";
import { IconChevronRight, IconHeart, IconPlus } from "./icons";
import { useLibrary } from "./LibraryProvider";
import { PageHeader } from "./PageHeader";

export function Mosaic({ artwork, size = 64 }: { artwork: string[]; size?: number }) {
  const half = size / 2;
  return (
    <span className="grid shrink-0 grid-cols-2 overflow-hidden rounded-2xl" style={{ width: size, height: size }}>
      {[0, 1, 2, 3].map((i) => (
        <Artwork key={i} src={artwork[i] ?? null} size={half} className="!rounded-none" />
      ))}
    </span>
  );
}

export function PlaylistsView() {
  const { playlists, refreshPlaylists, createPlaylist, toast } = useLibrary();
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    refreshPlaylists()
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, [refreshPlaylists]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await createPlaylist(name.trim());
      setName("");
      toast("Playlist created");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not create playlist");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Playlists" subtitle="Your training folders." />

      <SmartShuffleCard />

      <Link href="/favorites" className="card-surface flex min-h-[72px] items-center gap-4 p-3 active:scale-[0.98] transition">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-accent text-accent-fg">
          <IconHeart size={26} filled />
        </span>
        <span className="flex-1 font-display text-lg font-bold">Liked tracks</span>
        <IconChevronRight size={20} className="text-card-muted" />
      </Link>

      <form onSubmit={submit} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="New folder, e.g. Leg Day"
          aria-label="New playlist name"
          className="field"
        />
        <button type="submit" disabled={busy || !name.trim()} className="btn-accent shrink-0" aria-label="Create playlist">
          <IconPlus size={20} /> Create
        </button>
      </form>

      {loaded && playlists.length === 0 ? (
        <p className="rounded-2xl bg-fg/[0.06] px-4 py-8 text-center text-muted">
          No playlists yet. Create a folder above, then add tracks from any search result with the ⋯ menu.
        </p>
      ) : (
        <ul className="space-y-2">
          {playlists.map((p: Playlist) => (
            <li key={p.id}>
              <Link href={`/playlists/${p.id}`} className="card-surface flex min-h-[80px] items-center gap-4 p-2 pr-4 active:scale-[0.98] transition">
                <Mosaic artwork={p.artwork} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-lg font-bold">{p.name}</span>
                  <span className="text-sm text-card-muted">
                    {p.trackCount} {p.trackCount === 1 ? "track" : "tracks"}
                  </span>
                </span>
                <IconChevronRight size={20} className="text-card-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
