import { NextResponse } from "next/server";
import { clearSessionCookie, route } from "@/lib/api";

export const POST = route(async () => {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
});
