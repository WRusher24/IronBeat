import { desc, eq, sql } from "drizzle-orm";
import { db, playlists, playlistTracks } from "@/db";
import { json, readJson, requireUserId, route } from "@/lib/api";
import { playlistNameSchema } from "@/lib/validation";
import type { PlaylistSummary } from "@/lib/types";

export const GET = route(async () => {
  const userId = await requireUserId();
  const rows = await db()
    .select({
      id: playlists.id,
      name: playlists.name,
      updatedAt: playlists.updatedAt,
      trackCount: sql<number>`count(${playlistTracks.id})::int`,
      covers: sql<(string | null)[]>`coalesce((array_agg(${playlistTracks.thumbnail} order by ${playlistTracks.position}) filter (where ${playlistTracks.thumbnail} is not null))[1:4], '{}')`,
    })
    .from(playlists)
    .leftJoin(playlistTracks, eq(playlistTracks.playlistId, playlists.id))
    .where(eq(playlists.userId, userId))
    .groupBy(playlists.id)
    .orderBy(desc(playlists.updatedAt));

  const result: PlaylistSummary[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    trackCount: r.trackCount,
    updatedAt: r.updatedAt.toISOString(),
    covers: (r.covers ?? []).filter((c): c is string => !!c),
  }));
  return json({ playlists: result });
});

export const POST = route(async (req) => {
  const userId = await requireUserId();
  const { name } = await readJson(req, (v) => playlistNameSchema.parse(v));
  const [created] = await db().insert(playlists).values({ userId, name }).returning();
  return json(
    {
      playlist: {
        id: created.id,
        name: created.name,
        trackCount: 0,
        updatedAt: created.updatedAt.toISOString(),
        covers: [],
      } satisfies PlaylistSummary,
    },
    { status: 201 },
  );
});
