import { NextResponse } from "next/server";
import { requireUser, route } from "@/lib/api";
import { sourceStatuses } from "@/lib/sources";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireUser();
  return NextResponse.json({ sources: sourceStatuses() });
});
