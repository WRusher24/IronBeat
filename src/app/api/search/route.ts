import { NextResponse } from "next/server";
import { ApiError, requireUser, route } from "@/lib/api";
import { recordSearch } from "@/lib/history";
import { searchAll } from "@/lib/sources";
import { normalizeQuery } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

export const GET = route(async (req) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const query = normalizeQuery(url.searchParams.get("q") ?? "");
  if (query.length < 2) throw new ApiError(400, "Type at least 2 characters to search.");

  const result = await searchAll(query);
  // Only successful searches become quick-launch chips, and only when the client asks for it
  // (typed searches and chips record; mood launches do not).
  if (url.searchParams.get("record") === "1" && result.tracks.length > 0) {
    await recordSearch(user.id, query);
  }
  return NextResponse.json(result);
});

