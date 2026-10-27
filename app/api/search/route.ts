import { HttpError, json, requireUserId, route } from "@/lib/api";
import { recordSearch } from "@/lib/history";
import { rateLimit } from "@/lib/rate-limit";
import { searchAll } from "@/lib/search";
import { normalizeQuery } from "@/lib/utils";
import { searchQuerySchema } from "@/lib/validation";

export const maxDuration = 30;

export const GET = route(async (req) => {
  const userId = await requireUserId();
  if (!rateLimit(`search:${userId}`, 40, 60 * 1000)) {
    throw new HttpError(429, "Slow down a little – too many searches.");
  }
  const url = new URL(req.url);
  const parsed = searchQuerySchema.safeParse(url.searchParams.get("q") ?? "");
  if (!parsed.success) throw new HttpError(400, "Type something to search for.");

  const tracks = await searchAll(parsed.data);

  // Only successful searches become quick-launch chips and feed Smart Shuffle.
  if (tracks.length > 0 && url.searchParams.get("record") !== "0") {
    await recordSearch(userId, parsed.data);
  }
  return json({ query: normalizeQuery(parsed.data), tracks });
});
