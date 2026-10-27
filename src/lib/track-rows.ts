import type { Track, TrackSource } from "./types";

interface TrackRow {
  trackKey: string;
  source: string;
  sourceId: string;
  title: string;
  artist: string;
  artwork: string | null;
  duration: number | null;
}

export function rowToTrack(row: TrackRow): Track {
  return {
    key: row.trackKey,
    source: row.source as TrackSource,
    sourceId: row.sourceId,
    title: row.title,
    artist: row.artist,
    artwork: row.artwork,
    duration: row.duration,
  };
}
