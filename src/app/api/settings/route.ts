import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { readJson, requireUser, route } from "@/lib/api";
import { displayNameSchema, themeSchema } from "@/lib/validation";

export const PATCH = route(async (req) => {
  const user = await requireUser();
  const body = (await readJson(req)) as Record<string, unknown>;
  const patch: Partial<{ theme: string; displayName: string }> = {};
  if ("theme" in body) patch.theme = themeSchema.parse(body).theme;
  if ("displayName" in body) patch.displayName = displayNameSchema.parse(body).displayName;
  if (Object.keys(patch).length > 0) await db.update(users).set(patch).where(eq(users.id, user.id));
  return NextResponse.json({ ok: true, ...patch });
});
