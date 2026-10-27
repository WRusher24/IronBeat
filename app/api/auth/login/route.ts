import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db, users } from "@/db";
import { clientIp, HttpError, json, readJson, route } from "@/lib/api";
import { setSessionCookie } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { THEME_COOKIE } from "@/lib/themes";
import { loginSchema } from "@/lib/validation";

// Valid hash compared against when the email is unknown, keeping response time constant.
let dummyHash: string | null = null;
const getDummyHash = () => (dummyHash ??= bcrypt.hashSync("ironbeat-timing-equalizer", 11));

export const POST = route(async (req) => {
  const input = await readJson(req, (v) => loginSchema.parse(v));
  if (
    !rateLimit(`login:${clientIp(req)}`, 30, 15 * 60 * 1000) ||
    !rateLimit(`login-email:${input.email}`, 8, 15 * 60 * 1000)
  ) {
    throw new HttpError(429, "Too many attempts. Please wait a few minutes.");
  }

  const [user] = await db().select().from(users).where(eq(users.email, input.email)).limit(1);
  const valid = await bcrypt.compare(input.password, user?.passwordHash ?? getDummyHash());
  if (!user || !valid) throw new HttpError(401, "Incorrect email or password.");

  await setSessionCookie(user.id);
  (await cookies()).set(THEME_COOKIE, user.theme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return json({ ok: true });
});
