import { trackId, type Track } from "@/lib/types";

interface TrackRowLike {
  source: string;
  sourceId: string;
  title: string;
  artist: string;
  thumbnail: string | null;
  audioUrl: string | null;
  durationSec: number | null;
}

export function rowToTrack(row: TrackRowLike): Track {
  const source = row.source as Track["source"];
  return {
    id: trackId(source, row.sourceId),
    source,
    sourceId: row.sourceId,
    title: row.title,
    artist: row.artist,
    thumbnail: row.thumbnail,
    audioUrl: row.audioUrl,
    durationSec: row.durationSec,
  };
}
