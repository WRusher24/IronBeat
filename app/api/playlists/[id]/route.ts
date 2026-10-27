import { and, asc, eq } from "drizzle-orm";
import { db, playlists, playlistTracks } from "@/db";
import { json, readJson, requireUserId, route } from "@/lib/api";
import { ownedPlaylistId } from "@/lib/playlist-access";
import { rowToTrack } from "@/lib/track-rows";
import { playlistNameSchema } from "@/lib/validation";
import type { PlaylistDetail } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (_req, { params }: Ctx) => {
  const userId = await requireUserId();
  const id = await ownedPlaylistId(userId, (await params).id);
  const [playlist] = await db().select().from(playlists).where(eq(playlists.id, id));
  const rows = await db()
    .select()
    .from(playlistTracks)
    .where(and(eq(playlistTracks.playlistId, id), eq(playlistTracks.userId, userId)))
    .orderBy(asc(playlistTracks.position), asc(playlistTracks.addedAt));

  const detail: PlaylistDetail = {
    id: playlist.id,
    name: playlist.name,
    tracks: rows.map((r) => ({ ...rowToTrack(r), entryId: r.id })),
  };
  return json({ playlist: detail });
});

export const PATCH = route(async (req, { params }: Ctx) => {
  const userId = await requireUserId();
  const id = await ownedPlaylistId(userId, (await params).id);
  const { name } = await readJson(req, (v) => playlistNameSchema.parse(v));
  await db().update(playlists).set({ name, updatedAt: new Date() }).where(eq(playlists.id, id));
  return json({ id, name });
});

export const DELETE = route(async (_req, { params }: Ctx) => {
  const userId = await requireUserId();
  const id = await ownedPlaylistId(userId, (await params).id);
  await db().delete(playlists).where(and(eq(playlists.id, id), eq(playlists.userId, userId)));
  return json({ ok: true });
});
