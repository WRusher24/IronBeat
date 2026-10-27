import { sql } from "drizzle-orm";
import { db, searchHistory } from "@/db";
import { normalizeQuery } from "@/lib/utils";

/** Upserts a successful search for the user and bumps its hit counter. */
export async function recordSearch(userId: string, query: string): Promise<void> {
  const normalized = normalizeQuery(query);
  if (!normalized) return;
  await db()
    .insert(searchHistory)
    .values({ userId, query: normalized })
    .onConflictDoUpdate({
      target: [searchHistory.userId, searchHistory.query],
      set: { hits: sql`${searchHistory.hits} + 1`, lastSearchedAt: sql`now()` },
    });
}
