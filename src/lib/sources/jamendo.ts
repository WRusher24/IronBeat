import type { Track } from "../types";
import { fetchJson } from "./http";

interface JamendoTrack {
  id: string;
  name: string;
  artist_name: string;
  duration?: number;
  image?: string;
  audio?: string;
  audiodownload_allowed?: boolean;
}

export const jamendoEnabled = () => Boolean(process.env.JAMENDO_CLIENT_ID);

function endpoint(params: Record<string, string>): string {
  return `https://api.jamendo.com/v3.0/tracks/?${new URLSearchParams({
    client_id: process.env.JAMENDO_CLIENT_ID ?? "",
    format: "json",
    audioformat: "mp32",
    ...params,
  })}`;
}

/** Jamendo hosts Creative-Commons licensed music (free client id required). */
export async function searchJamendo(query: string, limit: number): Promise<Track[]> {
  if (!jamendoEnabled()) return [];
  const res = await fetchJson<{ results?: JamendoTrack[] }>(
    endpoint({ search: query, limit: String(limit), order: "popularity_total" }),
    { revalidate: 1800 },
  );
  return (res.results ?? []).map((t) => ({
    key: `jamendo:${t.id}`,
    source: "jamendo" as const,
    sourceId: t.id,
    title: t.name,
    artist: t.artist_name,
    artwork: t.image ?? null,
    duration: t.duration ?? null,
  }));
}

export async function resolveJamendoStream(id: string): Promise<string | null> {
  if (!jamendoEnabled()) return null;
  const res = await fetchJson<{ results?: JamendoTrack[] }>(endpoint({ id, limit: "1" }), { revalidate: 600 });
  return res.results?.[0]?.audio ?? null;
}
