import { eq, sql } from "drizzle-orm";
import { db, playlists, playlistTracks } from "@/db";
import { json, readJson, requireUserId, route } from "@/lib/api";
import { ownedPlaylistId } from "@/lib/playlist-access";
import { trackSchema } from "@/lib/validation";

export const POST = route(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const userId = await requireUserId();
  const playlistId = await ownedPlaylistId(userId, (await params).id);
  const track = await readJson(req, (v) => trackSchema.parse(v));

  const [{ next }] = await db()
    .select({ next: sql<number>`coalesce(max(${playlistTracks.position}), -1) + 1` })
    .from(playlistTracks)
    .where(eq(playlistTracks.playlistId, playlistId));

  const inserted = await db()
    .insert(playlistTracks)
    .values({ playlistId, userId, ...track, position: Number(next) })
    .onConflictDoNothing({ target: [playlistTracks.playlistId, playlistTracks.source, playlistTracks.sourceId] })
    .returning({ id: playlistTracks.id });

  await db().update(playlists).set({ updatedAt: new Date() }).where(eq(playlists.id, playlistId));
  return json({ added: inserted.length > 0 }, { status: inserted.length > 0 ? 201 : 200 });
});
