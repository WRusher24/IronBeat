import { normalizeQuery, shuffle } from "@/lib/utils";
import type { Track } from "@/lib/types";
import { searchYouTube } from "@/lib/sources/youtube";
import { searchArchive } from "@/lib/sources/archive";
import { searchOpenverse } from "@/lib/sources/openverse";
import { searchJamendo } from "@/lib/sources/jamendo";

const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 300;
const cache = new Map<string, { at: number; tracks: Track[] }>();

/** Interleaves result lists so every source is represented near the top. */
function roundRobin(lists: Track[][], limit: number): Track[] {
  const seen = new Set<string>();
  const out: Track[] = [];
  const longest = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < longest && out.length < limit; i++) {
    for (const list of lists) {
      const track = list[i];
      if (track && !seen.has(track.id)) {
        seen.add(track.id);
        out.push(track);
        if (out.length >= limit) break;
      }
    }
  }
  return out;
}

/** Orders a source's results so titles/artists that contain more of the query words come first. */
function rankByRelevance(tracks: Track[], query: string): Track[] {
  const words = query.split(" ").filter((w) => w.length > 1);
  if (words.length === 0) return tracks;
  const score = (t: Track) => {
    const hay = `${t.title} ${t.artist}`.toLowerCase();
    return words.filter((w) => hay.includes(w)).length;
  };
  return tracks
    .map((track, i) => ({ track, i, s: score(track) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.track);
}

/**
 * Unified audio search across YouTube (when a key is configured), Jamendo (when configured),
 * Openverse and the Internet Archive. Failing sources are skipped so one outage never blocks playback.
 */
export async function searchAll(rawQuery: string, limit = 30): Promise<Track[]> {
  const query = normalizeQuery(rawQuery);
  if (!query) return [];

  const hit = cache.get(query);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.tracks.slice(0, limit);

  const settled = await Promise.allSettled([
    searchYouTube(query),
    searchJamendo(query),
    searchOpenverse(query),
    searchArchive(query),
  ]);
  const lists = settled.map((r) => {
    if (r.status === "fulfilled") return r.value;
    console.warn("[search] source failed:", r.reason instanceof Error ? r.reason.message : r.reason);
    return [];
  });

  const tracks = roundRobin(
    lists.map((l) => (l[0]?.source === "youtube" ? l : rankByRelevance(l, query))), // YouTube's own ranking is already relevance-ordered
    40,
  );
  if (tracks.length > 0) {
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
    cache.set(query, { at: Date.now(), tracks });
  }
  return tracks.slice(0, limit);
}

/** Builds a dynamic mix from several queries, de-duplicated and shuffled. */
export async function searchMix(queries: string[], perQueryLimit = 12, total = 40): Promise<Track[]> {
  const results = await Promise.all(queries.map((q) => searchAll(q, perQueryLimit)));
  return shuffle(roundRobin(results, total));
}
