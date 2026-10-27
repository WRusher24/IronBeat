import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { favorites } from "@/db/schema";
import { ApiError, readJson, requireUser, route } from "@/lib/api";
import { rowToTrack } from "@/lib/track-rows";
import { trackSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireUser();
  const rows = await db.select().from(favorites).where(eq(favorites.userId, user.id)).orderBy(desc(favorites.addedAt));
  return NextResponse.json({ tracks: rows.map(rowToTrack) });
});

export const POST = route(async (req) => {
  const user = await requireUser();
  const t = trackSchema.parse(await readJson(req));
  await db
    .insert(favorites)
    .values({
      userId: user.id,
      trackKey: `${t.source}:${t.sourceId}`,
      source: t.source,
      sourceId: t.sourceId,
      title: t.title,
      artist: t.artist,
      artwork: t.artwork ?? null,
      duration: t.duration ?? null,
    })
    .onConflictDoNothing();
  return NextResponse.json({ ok: true }, { status: 201 });
});

export const DELETE = route(async (req) => {
  const user = await requireUser();
  const key = new URL(req.url).searchParams.get("key");
  if (!key) throw new ApiError(400, "Missing track key.");
  await db.delete(favorites).where(and(eq(favorites.userId, user.id), eq(favorites.trackKey, key)));
  return NextResponse.json({ ok: true });
});
