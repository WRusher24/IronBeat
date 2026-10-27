import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { searchHistory } from "@/db/schema";
import { requireUser, route } from "@/lib/api";
import { normalizeQuery } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireUser();
  const rows = await db
    .select({ query: searchHistory.query, count: searchHistory.count })
    .from(searchHistory)
    .where(eq(searchHistory.userId, user.id))
    .orderBy(desc(searchHistory.lastSearchedAt))
    .limit(15);
  return NextResponse.json({ history: rows });
});

export const DELETE = route(async (req) => {
  const user = await requireUser();
  const query = normalizeQuery(new URL(req.url).searchParams.get("query") ?? "");
  await db
    .delete(searchHistory)
    .where(query ? and(eq(searchHistory.userId, user.id), eq(searchHistory.query, query)) : eq(searchHistory.userId, user.id));
  return NextResponse.json({ ok: true });
});
