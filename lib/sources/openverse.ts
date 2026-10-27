import { trackId, type Track } from "@/lib/types";
import { fetchJson } from "./http";

interface OpenverseResponse {
  results?: {
    id: string;
    title?: string;
    creator?: string;
    url?: string;
    thumbnail?: string | null;
    duration?: number | null;
    filetype?: string | null;
  }[];
}

export async function searchOpenverse(query: string, limit = 10): Promise<Track[]> {
  const url =
    "https://api.openverse.org/v1/audio/?" +
    new URLSearchParams({ q: query, page_size: String(limit), category: "music", mature: "false" });
  const data = await fetchJson<OpenverseResponse>(url);
  const tracks: Track[] = [];
  for (const item of data.results ?? []) {
    if (!item.url || !item.url.startsWith("https://")) continue;
    const seconds = item.duration ? Math.round(item.duration / 1000) : null;
    tracks.push({
      id: trackId("openverse", item.id),
      source: "openverse",
      sourceId: item.id,
      title: item.title?.trim() || "Untitled",
      artist: item.creator?.trim() || "Unknown artist",
      thumbnail: item.thumbnail ?? null,
      audioUrl: item.url,
      durationSec: seconds && seconds > 0 ? seconds : null,
    });
  }
  return tracks;
}
