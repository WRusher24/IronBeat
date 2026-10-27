import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { playlists, playlistTracks } from "@/db/schema";
import { ApiError, isUuid, readJson, requireUser, route } from "@/lib/api";
import { trackSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route<Ctx>(async (req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  if (!isUuid(id)) throw new ApiError(404, "Playlist not found.");
  const [playlist] = await db
    .select({ id: playlists.id })
    .from(playlists)
    .where(and(eq(playlists.id, id), eq(playlists.userId, user.id)))
    .limit(1);
  if (!playlist) throw new ApiError(404, "Playlist not found.");

  const t = trackSchema.parse(await readJson(req));
  const inserted = await db
    .insert(playlistTracks)
    .values({
      playlistId: playlist.id,
      userId: user.id,
      trackKey: `${t.source}:${t.sourceId}`,
      source: t.source,
      sourceId: t.sourceId,
      title: t.title,
      artist: t.artist,
      artwork: t.artwork ?? null,
      duration: t.duration ?? null,
      position: sql`(select coalesce(max(${playlistTracks.position}), -1) + 1 from ${playlistTracks} where ${playlistTracks.playlistId} = ${playlist.id})`,
    })
    .onConflictDoNothing()
    .returning({ id: playlistTracks.id });

  await db.update(playlists).set({ updatedAt: new Date() }).where(eq(playlists.id, playlist.id));
  return NextResponse.json({ added: inserted.length > 0 }, { status: inserted.length > 0 ? 201 : 200 });
});
