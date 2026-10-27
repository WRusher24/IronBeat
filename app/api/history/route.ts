import { and, desc, eq } from "drizzle-orm";
import { db, searchHistory } from "@/db";
import { json, requireUserId, route } from "@/lib/api";
import { normalizeQuery } from "@/lib/utils";

export const GET = route(async () => {
  const userId = await requireUserId();
  const rows = await db()
    .select({ query: searchHistory.query, hits: searchHistory.hits })
    .from(searchHistory)
    .where(eq(searchHistory.userId, userId))
    .orderBy(desc(searchHistory.lastSearchedAt))
    .limit(20);
  return json({ chips: rows });
});

export const DELETE = route(async (req) => {
  const userId = await requireUserId();
  const q = normalizeQuery(new URL(req.url).searchParams.get("q") ?? "");
  const condition = q
    ? and(eq(searchHistory.userId, userId), eq(searchHistory.query, q))
    : eq(searchHistory.userId, userId);
  await db().delete(searchHistory).where(condition);
  return json({ ok: true });
});
