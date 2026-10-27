import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ApiError, clientIp, readJson, route, setSessionCookies } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { createSessionToken } from "@/lib/session";
import { loginSchema } from "@/lib/validation";

// A valid bcrypt hash used to keep response timing constant for unknown emails.
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO5U4F5mZ3xVd8kQe0g0q5mP1x8mYyqZK";

export const POST = route(async (req) => {
  const input = loginSchema.parse(await readJson(req));

  const limit = rateLimit(`login:${clientIp(req)}:${input.email}`, 8, 15 * 60 * 1000);
  if (!limit.ok) throw new ApiError(429, `Too many attempts. Try again in ${Math.ceil(limit.retryAfter / 60)} min.`);

  const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
  const valid = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) throw new ApiError(401, "Invalid email or password.");

  await setSessionCookies(await createSessionToken(user.id), user.theme);
  return NextResponse.json({
    user: { id: user.id, email: user.email, displayName: user.displayName, theme: user.theme },
  });
});
