import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ApiError, clientIp, readJson, route, setSessionCookies } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { createSessionToken } from "@/lib/session";
import { DEFAULT_THEME } from "@/lib/themes";
import { registerSchema } from "@/lib/validation";

export const POST = route(async (req) => {
  const limit = rateLimit(`register:${clientIp(req)}`, 10, 60 * 60 * 1000);
  if (!limit.ok) throw new ApiError(429, `Too many sign-ups from this network. Try again in ${Math.ceil(limit.retryAfter / 60)} min.`);

  const input = registerSchema.parse(await readJson(req));
  const passwordHash = await bcrypt.hash(input.password, 12);

  const [created] = await db
    .insert(users)
    .values({ email: input.email, passwordHash, displayName: input.displayName, theme: DEFAULT_THEME })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id, email: users.email, displayName: users.displayName, theme: users.theme });

  if (!created) throw new ApiError(409, "An account with this email already exists. Try signing in.");

  await setSessionCookies(await createSessionToken(created.id), created.theme);
  return NextResponse.json({ user: created }, { status: 201 });
});
