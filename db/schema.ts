import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  theme: text("theme").notNull().default("warm"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const playlists = pgTable(
  "playlists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("playlists_user_idx").on(t.userId)],
);

/** Columns that describe a playable track, shared by playlist entries and favorites. */
const trackColumns = {
  source: text("source").notNull(), // youtube | archive | openverse | jamendo
  sourceId: text("source_id").notNull(),
  title: text("title").notNull(),
  artist: text("artist").notNull().default(""),
  thumbnail: text("thumbnail"),
  audioUrl: text("audio_url"),
  durationSec: integer("duration_sec"),
};

export const playlistTracks = pgTable(
  "playlist_tracks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playlistId: uuid("playlist_id")
      .notNull()
      .references(() => playlists.id, { onDelete: "cascade" }),
    // Denormalised owner id: every query filters on it so isolation never depends on a join.
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ...trackColumns,
    position: integer("position").notNull().default(0),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("playlist_tracks_playlist_idx").on(t.playlistId, t.position),
    uniqueIndex("playlist_tracks_unique").on(t.playlistId, t.source, t.sourceId),
  ],
);

export const favorites = pgTable(
  "favorites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ...trackColumns,
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("favorites_unique").on(t.userId, t.source, t.sourceId)],
);

export const searchHistory = pgTable(
  "search_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    query: text("query").notNull(),
    hits: integer("hits").notNull().default(1),
    lastSearchedAt: timestamp("last_searched_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex("search_history_unique").on(t.userId, t.query),
    index("search_history_recent_idx").on(t.userId, t.lastSearchedAt),
  ],
);

export type User = typeof users.$inferSelect;
export type PlaylistRow = typeof playlists.$inferSelect;
export type PlaylistTrackRow = typeof playlistTracks.$inferSelect;
export type FavoriteRow = typeof favorites.$inferSelect;
