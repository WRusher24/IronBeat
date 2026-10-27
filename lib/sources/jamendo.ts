import { trackId, type Track } from "@/lib/types";
import { fetchJson } from "./http";

interface JamendoResponse {
  results?: {
    id: string;
    name: string;
    artist_name: string;
    image?: string;
    audio?: string;
    duration?: number;
    audiodownload_allowed?: boolean;
  }[];
}

export const jamendoEnabled = () => Boolean(process.env.JAMENDO_CLIENT_ID);

export async function searchJamendo(query: string, limit = 10): Promise<Track[]> {
  const clientId = process.env.JAMENDO_CLIENT_ID;
  if (!clientId) return [];
  const url =
    "https://api.jamendo.com/v3.0/tracks/?" +
    new URLSearchParams({
      client_id: clientId,
      format: "json",
      limit: String(limit),
      search: query,
      audioformat: "mp32",
      order: "popularity_total",
      include: "musicinfo",
    });
  const data = await fetchJson<JamendoResponse>(url);
  return (data.results ?? [])
    .filter((t) => t.audio)
    .map((t) => ({
      id: trackId("jamendo", t.id),
      source: "jamendo" as const,
      sourceId: t.id,
      title: t.name,
      artist: t.artist_name,
      thumbnail: t.image ?? null,
      audioUrl: t.audio ?? null,
      durationSec: t.duration ?? null,
    }));
}
