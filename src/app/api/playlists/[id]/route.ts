import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { playlists, playlistTracks } from "@/db/schema";
import { ApiError, isUuid, readJson, requireUser, route } from "@/lib/api";
import { rowToTrack } from "@/lib/track-rows";
import { playlistNameSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function ownedPlaylist(userId: string, id: string) {
  if (!isUuid(id)) throw new ApiError(404, "Playlist not found.");
  const [row] = await db
    .select()
    .from(playlists)
    .where(and(eq(playlists.id, id), eq(playlists.userId, userId)))
    .limit(1);
  if (!row) throw new ApiError(404, "Playlist not found.");
  return row;
}

export const GET = route<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  const playlist = await ownedPlaylist(user.id, (await params).id);
  const rows = await db
    .select()
    .from(playlistTracks)
    .where(and(eq(playlistTracks.playlistId, playlist.id), eq(playlistTracks.userId, user.id)))
    .orderBy(asc(playlistTracks.position));
  return NextResponse.json({
    playlist: { id: playlist.id, name: playlist.name, updatedAt: playlist.updatedAt.toISOString() },
    tracks: rows.map(rowToTrack),
  });
});

export const PATCH = route<Ctx>(async (req, { params }) => {
  const user = await requireUser();
  const playlist = await ownedPlaylist(user.id, (await params).id);
  const { name } = playlistNameSchema.parse(await readJson(req));
  await db
    .update(playlists)
    .set({ name, updatedAt: new Date() })
    .where(and(eq(playlists.id, playlist.id), eq(playlists.userId, user.id)));
  return NextResponse.json({ ok: true });
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  const playlist = await ownedPlaylist(user.id, (await params).id);
  await db.delete(playlists).where(and(eq(playlists.id, playlist.id), eq(playlists.userId, user.id)));
  return NextResponse.json({ ok: true });
});
