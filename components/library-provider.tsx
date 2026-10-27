"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/client-api";
import type { PlaylistSummary, Track } from "@/lib/types";
import { useToast } from "@/components/toast";
import { AddToPlaylistSheet } from "@/components/add-to-playlist-sheet";

interface LibraryContextValue {
  favoriteIds: Set<string>;
  favoritesLoaded: boolean;
  playlists: PlaylistSummary[];
  playlistsLoaded: boolean;
  isFavorite(track: Track): boolean;
  toggleFavorite(track: Track): Promise<void>;
  refreshPlaylists(): Promise<void>;
  createPlaylist(name: string): Promise<PlaylistSummary>;
  addToPlaylist(playlistId: string, track: Track): Promise<boolean>;
  openAddSheet(track: Track): void;
  favoritesVersion: number;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used inside <LibraryProvider>");
  return ctx;
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { notify } = useToast();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const [favoritesVersion, setFavoritesVersion] = useState(0);
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [playlistsLoaded, setPlaylistsLoaded] = useState(false);
  const [sheetTrack, setSheetTrack] = useState<Track | null>(null);

  const refreshPlaylists = useCallback(async () => {
    const data = await api<{ playlists: PlaylistSummary[] }>("/api/playlists");
    setPlaylists(data.playlists);
    setPlaylistsLoaded(true);
  }, []);

  useEffect(() => {
    api<{ tracks: Track[] }>("/api/favorites")
      .then((data) => setFavoriteIds(new Set(data.tracks.map((t) => t.id))))
      .catch(() => undefined)
      .finally(() => setFavoritesLoaded(true));
    refreshPlaylists().catch(() => setPlaylistsLoaded(true));
  }, [refreshPlaylists]);

  const toggleFavorite = useCallback(
    async (track: Track) => {
      const wasFavorite = favoriteIds.has(track.id);
      const update = (add: boolean) =>
        setFavoriteIds((prev) => {
          const copy = new Set(prev);
          if (add) copy.add(track.id);
          else copy.delete(track.id);
          return copy;
        });
      update(!wasFavorite); // optimistic
      try {
        if (wasFavorite) {
          await api(`/api/favorites?source=${track.source}&sourceId=${encodeURIComponent(track.sourceId)}`, {
            method: "DELETE",
          });
        } else {
          await api("/api/favorites", {
            method: "POST",
            json: {
              source: track.source,
              sourceId: track.sourceId,
              title: track.title,
              artist: track.artist,
              thumbnail: track.thumbnail,
              audioUrl: track.audioUrl,
              durationSec: track.durationSec === null ? null : Math.round(track.durationSec),
            },
          });
        }
        setFavoritesVersion((v) => v + 1);
      } catch (err) {
        update(wasFavorite);
        notify(err instanceof Error ? err.message : "Could not update favorites.");
      }
    },
    [favoriteIds, notify],
  );

  const createPlaylist = useCallback(async (name: string) => {
    const data = await api<{ playlist: PlaylistSummary }>("/api/playlists", { method: "POST", json: { name } });
    setPlaylists((prev) => [data.playlist, ...prev]);
    return data.playlist;
  }, []);

  const addToPlaylist = useCallback(
    async (playlistId: string, track: Track) => {
      try {
        const res = await api<{ added: boolean }>(`/api/playlists/${playlistId}/tracks`, {
          method: "POST",
          json: {
            source: track.source,
            sourceId: track.sourceId,
            title: track.title,
            artist: track.artist,
            thumbnail: track.thumbnail,
            audioUrl: track.audioUrl,
            durationSec: track.durationSec === null ? null : Math.round(track.durationSec),
          },
        });
        void refreshPlaylists();
        return res.added;
      } catch (err) {
        notify(err instanceof Error ? err.message : "Could not add the track.");
        return false;
      }
    },
    [notify, refreshPlaylists],
  );

  const value = useMemo<LibraryContextValue>(
    () => ({
      favoriteIds,
      favoritesLoaded,
      playlists,
      playlistsLoaded,
      favoritesVersion,
      isFavorite: (track) => favoriteIds.has(track.id),
      toggleFavorite,
      refreshPlaylists,
      createPlaylist,
      addToPlaylist,
      openAddSheet: setSheetTrack,
    }),
    [
      favoriteIds, favoritesLoaded, playlists, playlistsLoaded, favoritesVersion, toggleFavorite,
      refreshPlaylists, createPlaylist, addToPlaylist,
    ],
  );

  return (
    <LibraryContext.Provider value={value}>
      {children}
      <AddToPlaylistSheet track={sheetTrack} onClose={() => setSheetTrack(null)} />
    </LibraryContext.Provider>
  );
}
