import type { Track } from "../types";
import { decodeEntities, fetchJson } from "./http";

interface YtSearchResponse {
  items?: {
    id: { videoId: string };
    snippet: { title: string; channelTitle: string; thumbnails?: Record<string, { url: string }> };
  }[];
}

interface YtVideosResponse {
  items?: { id: string; contentDetails: { duration: string } }[];
}

export const youtubeEnabled = () => Boolean(process.env.YOUTUBE_API_KEY);

function isoDurationToSeconds(iso: string): number | null {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!m) return null;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

/** YouTube Data API v3 search restricted to embeddable music videos. */
export async function searchYouTube(query: string, limit: number): Promise<Track[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return [];
  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    videoCategoryId: "10",
    videoEmbeddable: "true",
    videoSyndicated: "true",
    maxResults: String(limit),
    q: query,
    key,
  });
  const search = await fetchJson<YtSearchResponse>(`https://www.googleapis.com/youtube/v3/search?${params}`, {
    revalidate: 3600,
  });
  const items = search.items ?? [];
  if (items.length === 0) return [];

  const durations = new Map<string, number | null>();
  try {
    const details = await fetchJson<YtVideosResponse>(
      `https://www.googleapis.com/youtube/v3/videos?${new URLSearchParams({
        part: "contentDetails",
        id: items.map((i) => i.id.videoId).join(","),
        key,
      })}`,
      { revalidate: 86400 },
    );
    for (const v of details.items ?? []) durations.set(v.id, isoDurationToSeconds(v.contentDetails.duration));
  } catch {
    /* durations are optional */
  }

  return items.map((item) => {
    const id = item.id.videoId;
    const thumbs = item.snippet.thumbnails ?? {};
    return {
      key: `youtube:${id}`,
      source: "youtube" as const,
      sourceId: id,
      title: decodeEntities(item.snippet.title),
      artist: decodeEntities(item.snippet.channelTitle.replace(/ - Topic$/, "")),
      artwork: (thumbs.medium ?? thumbs.default ?? thumbs.high)?.url ?? `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
      duration: durations.get(id) ?? null,
    };
  });
}
