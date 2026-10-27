import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { playlists, playlistTracks } from "@/db/schema";
import { readJson, requireUser, route } from "@/lib/api";
import type { Playlist } from "@/lib/types";
import { playlistNameSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireUser();
  const rows = await db
    .select({
      id: playlists.id,
      name: playlists.name,
      updatedAt: playlists.updatedAt,
      // Raw, explicitly aliased SQL: drizzle renders column refs unqualified inside a correlated
      // subquery, which would resolve `id` against the inner table.
      trackCount: sql<number>`(select count(*)::int from playlist_tracks pt where pt.playlist_id = playlists.id)`,
    })
    .from(playlists)
    .where(eq(playlists.userId, user.id))
    .orderBy(desc(playlists.updatedAt));

  const artworkByPlaylist = new Map<string, string[]>();
  if (rows.length > 0) {
    const art = await db
      .select({ playlistId: playlistTracks.playlistId, artwork: playlistTracks.artwork })
      .from(playlistTracks)
      .where(inArray(playlistTracks.playlistId, rows.map((r) => r.id)))
      .orderBy(asc(playlistTracks.position));
    for (const a of art) {
      if (!a.artwork) continue;
      const list = artworkByPlaylist.get(a.playlistId) ?? [];
      if (list.length < 4) list.push(a.artwork);
      artworkByPlaylist.set(a.playlistId, list);
    }
  }

  const result: Playlist[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    trackCount: Number(r.trackCount),
    artwork: artworkByPlaylist.get(r.id) ?? [],
    updatedAt: r.updatedAt.toISOString(),
  }));
  return NextResponse.json({ playlists: result });
});

export const POST = route(async (req) => {
  const user = await requireUser();
  const { name } = playlistNameSchema.parse(await readJson(req));
  const [created] = await db.insert(playlists).values({ userId: user.id, name }).returning();
  const playlist: Playlist = {
    id: created.id,
    name: created.name,
    trackCount: 0,
    artwork: [],
    updatedAt: created.updatedAt.toISOString(),
  };
  return NextResponse.json({ playlist }, { status: 201 });
});
