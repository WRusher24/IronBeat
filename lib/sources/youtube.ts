import { trackId, type Track } from "@/lib/types";
import { decodeEntities, fetchJson } from "./http";

interface SearchResponse {
  items?: { id: { videoId?: string } }[];
}

interface VideosResponse {
  items?: {
    id: string;
    snippet: {
      title: string;
      channelTitle: string;
      thumbnails?: Record<string, { url: string }>;
    };
    contentDetails: { duration: string };
    status?: { embeddable?: boolean };
  }[];
}

/** Parses an ISO-8601 duration such as PT1H2M3S. Returns 0 for live streams (P0D). */
export function parseIsoDuration(iso: string): number {
  const match = iso.match(/^P(?:\d+D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return 0;
  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
}

const MAX_DURATION_SEC = 3 * 3600;

export const youtubeEnabled = () => Boolean(process.env.YOUTUBE_API_KEY);

export async function searchYouTube(query: string, limit = 15): Promise<Track[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return [];

  const searchUrl =
    "https://www.googleapis.com/youtube/v3/search?" +
    new URLSearchParams({
      part: "snippet",
      type: "video",
      q: query,
      maxResults: String(limit),
      videoEmbeddable: "true",
      videoSyndicated: "true",
      safeSearch: "moderate",
      key,
    });
  const search = await fetchJson<SearchResponse>(searchUrl);
  const ids = (search.items ?? []).map((i) => i.id.videoId).filter((id): id is string => !!id);
  if (ids.length === 0) return [];

  const videosUrl =
    "https://www.googleapis.com/youtube/v3/videos?" +
    new URLSearchParams({ part: "snippet,contentDetails,status", id: ids.join(","), key });
  const videos = await fetchJson<VideosResponse>(videosUrl);

  const byId = new Map((videos.items ?? []).map((v) => [v.id, v]));
  const tracks: Track[] = [];
  for (const id of ids) {
    const video = byId.get(id);
    if (!video || video.status?.embeddable === false) continue;
    const duration = parseIsoDuration(video.contentDetails.duration);
    if (duration === 0 || duration > MAX_DURATION_SEC) continue;
    const thumbs = video.snippet.thumbnails ?? {};
    tracks.push({
      id: trackId("youtube", id),
      source: "youtube",
      sourceId: id,
      title: decodeEntities(video.snippet.title),
      artist: decodeEntities(video.snippet.channelTitle),
      thumbnail: (thumbs.medium ?? thumbs.default ?? thumbs.high)?.url ?? null,
      audioUrl: null,
      durationSec: duration,
    });
  }
  return tracks;
}
