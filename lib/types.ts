export type TrackSource = "youtube" | "archive" | "openverse" | "jamendo";

export interface Track {
  /** Stable client id: `${source}:${sourceId}` */
  id: string;
  source: TrackSource;
  sourceId: string;
  title: string;
  artist: string;
  thumbnail: string | null;
  /** Direct audio stream for HTML5 playback. Null for YouTube (played through the IFrame API). */
  audioUrl: string | null;
  durationSec: number | null;
}

export interface PlaylistSummary {
  id: string;
  name: string;
  trackCount: number;
  updatedAt: string;
  covers: string[];
}

export interface PlaylistDetail {
  id: string;
  name: string;
  tracks: (Track & { entryId: string })[];
}

export const trackId = (source: TrackSource, sourceId: string) => `${source}:${sourceId}`;
