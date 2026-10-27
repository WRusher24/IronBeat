import { z } from "zod";

export const trackSchema = z.object({
  source: z.enum(["youtube", "archive", "openverse", "jamendo"]),
  sourceId: z.string().min(1).max(300),
  title: z.string().min(1).max(300),
  artist: z.string().max(300).default(""),
  thumbnail: z.string().url().max(1000).nullable().default(null),
  audioUrl: z.string().url().max(2000).nullable().default(null),
  durationSec: z.number().int().min(0).max(60 * 60 * 24).nullable().default(null),
});

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email("Enter a valid email address.")),
  password: z.string().min(8, "Password must be at least 8 characters.").max(200),
  displayName: z.string().trim().min(1, "Enter your name.").max(60),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
  password: z.string().min(1, "Enter your password.").max(200),
});

export const playlistNameSchema = z.object({
  name: z.string().trim().min(1, "Give the folder a name.").max(60),
});

export const themeSchema = z.object({ theme: z.enum(["warm", "ink", "sunset"]) });

export const searchQuerySchema = z.string().trim().min(1).max(100);
