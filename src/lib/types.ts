export type TrackSource = "youtube" | "audius" | "archive" | "jamendo";

export interface Track {
  /** Globally unique key: `${source}:${sourceId}` */
  key: string;
  source: TrackSource;
  sourceId: string;
  title: string;
  artist: string;
  artwork: string | null;
  /** Duration in seconds, when known up-front. */
  duration: number | null;
}

export interface Playlist {
  id: string;
  name: string;
  trackCount: number;
  artwork: string[];
  updatedAt: string;
}

export interface SourceStatus {
  id: TrackSource;
  name: string;
  enabled: boolean;
  note: string;
}

export interface SearchResponse {
  query: string;
  tracks: Track[];
  sources: { id: TrackSource; ok: boolean; count: number }[];
}

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  theme: string;
}
