import { HttpError, json, requireUserId, route } from "@/lib/api";
import { recordSearch } from "@/lib/history";
import { moodById } from "@/lib/moods";
import { searchMix } from "@/lib/search";

export const maxDuration = 30;

export const GET = route(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const userId = await requireUserId();
  const mood = moodById((await params).id);
  if (!mood) throw new HttpError(404, "Unknown mood.");

  const tracks = await searchMix(mood.queries);
  if (tracks.length > 0) await recordSearch(userId, mood.queries[0]);
  return json({ mood: { id: mood.id, title: mood.title }, tracks });
});
