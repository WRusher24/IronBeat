import { sql } from "drizzle-orm";
import { db } from "@/db";
import { searchHistory } from "@/db/schema";

export async function recordSearch(userId: string, query: string) {
  await db
    .insert(searchHistory)
    .values({ userId, query })
    .onConflictDoUpdate({
      target: [searchHistory.userId, searchHistory.query],
      set: { count: sql`${searchHistory.count} + 1`, lastSearchedAt: sql`now()` },
    });
}
