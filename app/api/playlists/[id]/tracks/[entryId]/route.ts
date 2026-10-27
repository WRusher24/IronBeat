import { and, eq } from "drizzle-orm";
import { db, playlists, playlistTracks } from "@/db";
import { json, requireUserId, route } from "@/lib/api";
import { ownedPlaylistId } from "@/lib/playlist-access";

export const DELETE = route(
  async (_req, { params }: { params: Promise<{ id: string; entryId: string }> }) => {
    const userId = await requireUserId();
    const { id, entryId } = await params;
    const playlistId = await ownedPlaylistId(userId, id);
    if (!/^[0-9a-f-]{36}$/i.test(entryId)) return json({ ok: true });
    await db()
      .delete(playlistTracks)
      .where(
        and(
          eq(playlistTracks.id, entryId),
          eq(playlistTracks.playlistId, playlistId),
          eq(playlistTracks.userId, userId),
        ),
      );
    await db().update(playlists).set({ updatedAt: new Date() }).where(eq(playlists.id, playlistId));
    return json({ ok: true });
  },
);
