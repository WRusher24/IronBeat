import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { playlists, playlistTracks } from "@/db/schema";
import { ApiError, isUuid, requireUser, route } from "@/lib/api";

type Ctx = { params: Promise<{ id: string; trackKey: string }> };

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  const { id, trackKey } = await params;
  if (!isUuid(id)) throw new ApiError(404, "Playlist not found.");
  const removed = await db
    .delete(playlistTracks)
    .where(
      and(
        eq(playlistTracks.playlistId, id),
        eq(playlistTracks.userId, user.id),
        eq(playlistTracks.trackKey, decodeURIComponent(trackKey)),
      ),
    )
    .returning({ id: playlistTracks.id });
  if (removed.length > 0) {
    await db.update(playlists).set({ updatedAt: new Date() }).where(and(eq(playlists.id, id), eq(playlists.userId, user.id)));
  }
  return NextResponse.json({ ok: true });
});
