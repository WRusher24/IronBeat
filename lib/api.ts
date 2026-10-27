import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const json = <T>(data: T, init?: ResponseInit) => NextResponse.json(data, init);

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/** Wraps a route handler with uniform error handling. */
export function route<C = unknown>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, { status: err.status });
      if (err instanceof ZodError) {
        return json({ error: err.issues[0]?.message ?? "Invalid input" }, { status: 400 });
      }
      console.error("[api]", err);
      return json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}

/** Resolves the authenticated user id from the session cookie or throws 401. */
export async function requireUserId(): Promise<string> {
  const userId = await verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!userId) throw new HttpError(401, "Please sign in to continue.");
  return userId;
}

export async function readJson<T>(req: Request, parse: (value: unknown) => T): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }
  return parse(body);
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
