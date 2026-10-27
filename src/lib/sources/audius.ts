import type { Track } from "../types";
import { fetchJson } from "./http";

const APP_NAME = "IronBeat";

interface AudiusTrack {
  id: string;
  title: string;
  duration?: number;
  is_streamable?: boolean;
  user?: { name?: string };
  artwork?: Record<string, string> | null;
}

let hostCache: { hosts: string[]; expires: number } | null = null;

async function discoveryHosts(): Promise<string[]> {
  if (hostCache && hostCache.expires > Date.now()) return hostCache.hosts;
  const res = await fetchJson<{ data: string[] }>("https://api.audius.co", { revalidate: 600 });
  const hosts = (res.data ?? []).filter((h) => h.startsWith("https://"));
  if (hosts.length === 0) throw new Error("No Audius discovery hosts available");
  hostCache = { hosts, expires: Date.now() + 10 * 60 * 1000 };
  return hosts;
}

async function withHost<T>(fn: (host: string) => Promise<T>): Promise<T> {
  const hosts = [...(await discoveryHosts())].sort(() => Math.random() - 0.5).slice(0, 3);
  let lastError: unknown;
  for (const host of hosts) {
    try {
      return await fn(host);
    } catch (err) {
      lastError = err;
    }
  }
  hostCache = null;
  throw lastError instanceof Error ? lastError : new Error("Audius request failed");
}

/** Audius is an open, keyless catalogue of full-length independent tracks. */
export async function searchAudius(query: string, limit: number): Promise<Track[]> {
  const res = await withHost((host) =>
    fetchJson<{ data: AudiusTrack[] }>(
      `${host}/v1/tracks/search?${new URLSearchParams({ query, limit: String(limit), app_name: APP_NAME })}`,
      { revalidate: 900 },
    ),
  );
  return (res.data ?? [])
    .filter((t) => t.is_streamable !== false)
    .map((t) => ({
      key: `audius:${t.id}`,
      source: "audius" as const,
      sourceId: t.id,
      title: t.title,
      artist: t.user?.name ?? "Unknown artist",
      artwork: t.artwork?.["480x480"] ?? t.artwork?.["150x150"] ?? null,
      duration: t.duration ?? null,
    }));
}

/** Resolves a stable redirect target for the audio element at play time. */
export async function resolveAudiusStream(id: string): Promise<string> {
  const host = (await discoveryHosts())[0];
  return `${host}/v1/tracks/${encodeURIComponent(id)}/stream?app_name=${APP_NAME}`;
}
