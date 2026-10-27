import { and, desc, eq } from "drizzle-orm";
import { db, favorites } from "@/db";
import { HttpError, json, readJson, requireUserId, route } from "@/lib/api";
import { rowToTrack } from "@/lib/track-rows";
import { trackSchema } from "@/lib/validation";

export const GET = route(async () => {
  const userId = await requireUserId();
  const rows = await db()
    .select()
    .from(favorites)
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));
  return json({ tracks: rows.map(rowToTrack) });
});

export const POST = route(async (req) => {
  const userId = await requireUserId();
  const track = await readJson(req, (v) => trackSchema.parse(v));
  await db()
    .insert(favorites)
    .values({ userId, ...track })
    .onConflictDoNothing({ target: [favorites.userId, favorites.source, favorites.sourceId] });
  return json({ ok: true }, { status: 201 });
});

export const DELETE = route(async (req) => {
  const userId = await requireUserId();
  const params = new URL(req.url).searchParams;
  const source = params.get("source");
  const sourceId = params.get("sourceId");
  if (!source || !sourceId) throw new HttpError(400, "source and sourceId are required.");
  await db()
    .delete(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.source, source), eq(favorites.sourceId, sourceId)));
  return json({ ok: true });
});
