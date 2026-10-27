import { NextResponse } from "next/server";
import { requireUser, route } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = route(async () => NextResponse.json({ user: await requireUser() }));
