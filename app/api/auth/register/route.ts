import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { clientIp, HttpError, json, readJson, route } from "@/lib/api";
import { setSessionCookie } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validation";

export const POST = route(async (req) => {
  if (!rateLimit(`register:${clientIp(req)}`, 10, 60 * 60 * 1000)) {
    throw new HttpError(429, "Too many sign-up attempts. Try again later.");
  }
  const input = await readJson(req, (v) => registerSchema.parse(v));

  const [existing] = await db().select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
  if (existing) throw new HttpError(409, "An account with this email already exists.");

  const passwordHash = await bcrypt.hash(input.password, 11);
  const [created] = await db()
    .insert(users)
    .values({ email: input.email, passwordHash, displayName: input.displayName })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id, theme: users.theme });
  if (!created) throw new HttpError(409, "An account with this email already exists.");

  await setSessionCookie(created.id);
  return json({ ok: true }, { status: 201 });
});
