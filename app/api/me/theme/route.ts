import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db, users } from "@/db";
import { json, readJson, requireUserId, route } from "@/lib/api";
import { THEME_COOKIE } from "@/lib/themes";
import { themeSchema } from "@/lib/validation";

export const PATCH = route(async (req) => {
  const userId = await requireUserId();
  const { theme } = await readJson(req, (v) => themeSchema.parse(v));
  await db().update(users).set({ theme }).where(eq(users.id, userId));
  (await cookies()).set(THEME_COOKIE, theme, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return json({ theme });
});
