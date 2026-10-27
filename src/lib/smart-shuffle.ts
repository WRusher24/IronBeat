import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { favorites, searchHistory } from "@/db/schema";
import { MOODS, pickQuery } from "./moods";
import { rowToTrack } from "./track-rows";
import { searchAll } from "./sources";
import type { Track } from "./types";

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Weighted sample without replacement: frequently searched genres surface more often. */
function weightedPick(entries: { value: string; weight: number }[], n: number): string[] {
  const pool = [...entries];
  const picked: string[] = [];
  while (picked.length < n && pool.length > 0) {
    const total = pool.reduce((sum, e) => sum + e.weight, 0);
    let roll = Math.random() * total;
    const idx = pool.findIndex((e) => (roll -= e.weight) <= 0);
    const [chosen] = pool.splice(idx === -1 ? pool.length - 1 : idx, 1);
    picked.push(chosen.value);
  }
  return picked;
}

export interface SmartMix {
  tracks: Track[];
  basedOn: string[];
}

/**
 * Builds a dynamic mix from the caller's own data: their most frequent searches and the
 * artists behind their favourite tracks, blended with the favourites themselves.
 */
export async function buildSmartShuffle(userId: string, size = 30): Promise<SmartMix> {
  const [history, favRows] = await Promise.all([
    db
      .select({ query: searchHistory.query, count: searchHistory.count })
      .from(searchHistory)
      .where(eq(searchHistory.userId, userId))
      .orderBy(desc(searchHistory.count), desc(searchHistory.lastSearchedAt))
      .limit(12),
    db.select().from(favorites).where(eq(favorites.userId, userId)).orderBy(desc(favorites.addedAt)).limit(100),
  ]);

  const artistCounts = new Map<string, number>();
  for (const f of favRows) {
    const artist = f.artist.trim();
    if (artist) artistCounts.set(artist, (artistCounts.get(artist) ?? 0) + 1);
  }

  const candidates = [
    ...history.map((h) => ({ value: h.query, weight: h.count * 2 })),
    ...[...artistCounts].map(([artist, c]) => ({ value: artist, weight: c * 3 })),
  ];

  let queries = weightedPick(candidates, 4);
  if (queries.length === 0) {
    queries = shuffle(MOODS).slice(0, 3).map(pickQuery);
  }

  const results = await Promise.all(queries.map((q) => searchAll(q, 10).catch(() => null)));
  const fresh = results.flatMap((r) => (r ? shuffle(r.tracks).slice(0, 12) : []));
  const favTracks = shuffle(favRows.map(rowToTrack)).slice(0, Math.ceil(size * 0.3));

  const seen = new Set<string>();
  const mix: Track[] = [];
  for (const track of shuffle([...fresh, ...favTracks])) {
    if (seen.has(track.key)) continue;
    seen.add(track.key);
    mix.push(track);
    if (mix.length >= size) break;
  }
  return { tracks: mix, basedOn: queries };
}
