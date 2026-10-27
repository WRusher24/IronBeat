import { and, eq } from "drizzle-orm";
import { db, playlists } from "@/db";
import { HttpError } from "@/lib/api";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Returns the playlist id only when it belongs to the user; otherwise throws 404 (never leaks existence). */
export async function ownedPlaylistId(userId: string, id: string): Promise<string> {
  if (!UUID.test(id)) throw new HttpError(404, "Playlist not found.");
  const [row] = await db()
    .select({ id: playlists.id })
    .from(playlists)
    .where(and(eq(playlists.id, id), eq(playlists.userId, userId)))
    .limit(1);
  if (!row) throw new HttpError(404, "Playlist not found.");
  return row.id;
}
