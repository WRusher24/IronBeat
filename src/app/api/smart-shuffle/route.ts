import { NextResponse } from "next/server";
import { ApiError, requireUser, route } from "@/lib/api";
import { buildSmartShuffle } from "@/lib/smart-shuffle";

export const dynamic = "force-dynamic";
export const maxDuration = 25;

export const GET = route(async () => {
  const user = await requireUser();
  const mix = await buildSmartShuffle(user.id);
  if (mix.tracks.length === 0) throw new ApiError(502, "Could not build a mix right now. Please try again.");
  return NextResponse.json(mix);
});
