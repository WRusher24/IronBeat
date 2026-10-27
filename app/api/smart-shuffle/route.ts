import { desc, eq, sql } from "drizzle-orm";
import { db, favorites, searchHistory } from "@/db";
import { json, requireUserId, route } from "@/lib/api";
import { MOODS } from "@/lib/moods";
import { searchMix } from "@/lib/search";
import { rowToTrack } from "@/lib/track-rows";
import { shuffle } from "@/lib/utils";
import type { Track } from "@/lib/types";

export const maxDuration = 30;

/** Picks up to `count` distinct items, weighting each by `weight`. */
function weightedPick<T>(items: T[], weight: (item: T) => number, count: number): T[] {
  const pool = items.slice();
  const picked: T[] = [];
  while (picked.length < count && pool.length > 0) {
    const total = pool.reduce((sum, item) => sum + weight(item), 0);
    let roll = Math.random() * total;
    let index = pool.findIndex((item) => (roll -= weight(item)) <= 0);
    if (index < 0) index = pool.length - 1;
    picked.push(pool.splice(index, 1)[0]);
  }
  return picked;
}

export const GET = route(async () => {
  const userId = await requireUserId();

  const [topSearches, favoriteRows] = await Promise.all([
    db()
      .select({ query: searchHistory.query, hits: searchHistory.hits })
      .from(searchHistory)
      .where(eq(searchHistory.userId, userId))
      .orderBy(desc(searchHistory.hits), desc(searchHistory.lastSearchedAt))
      .limit(8),
    db()
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId))
      .orderBy(sql`random()`)
      .limit(10),
  ]);

  const queries = weightedPick(topSearches, (s) => s.hits, 3).map((s) => s.query);
  const favoriteTracks: Track[] = favoriteRows.map(rowToTrack);

  // New users with no history still get a useful mix built from two random moods.
  const effectiveQueries =
    queries.length > 0
      ? queries
      : shuffle(MOODS)
          .slice(0, 2)
          .map((m) => m.queries[0]);

  const discovered = await searchMix(effectiveQueries, 14, 40);
  const known = new Set(favoriteTracks.map((t) => t.id));
  const mix = shuffle([...favoriteTracks, ...discovered.filter((t) => !known.has(t.id))]);

  return json({
    basedOn: effectiveQueries,
    favoritesUsed: favoriteTracks.length,
    tracks: mix,
  });
});
