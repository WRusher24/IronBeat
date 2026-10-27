import { z } from "zod";
import { THEMES } from "./themes";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Enter a valid email address.")
  .max(254, "Email address is too long.")
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address.");

export const registerSchema = z.object({
  displayName: z.string().trim().min(1, "Enter your name.").max(40, "Name must be 40 characters or fewer."),
  email,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password must be 72 characters or fewer."),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(72, "Invalid email or password."),
});

export const trackSchema = z.object({
  source: z.enum(["youtube", "audius", "archive", "jamendo"]),
  sourceId: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(300),
  artist: z.string().trim().max(200).default(""),
  artwork: z.string().url().max(1000).nullable().optional(),
  duration: z.number().int().min(0).max(60 * 60 * 24).nullable().optional(),
});

export const playlistNameSchema = z.object({
  name: z.string().trim().min(1, "Give your playlist a name.").max(60, "Playlist name must be 60 characters or fewer."),
});

export const themeSchema = z.object({
  theme: z.enum(THEMES.map((t) => t.id) as [string, ...string[]]),
});

export const displayNameSchema = z.object({
  displayName: z.string().trim().min(1, "Enter your name.").max(40, "Name must be 40 characters or fewer."),
});

export function normalizeQuery(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().toLowerCase().slice(0, 100);
}
