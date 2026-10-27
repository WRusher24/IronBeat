import type { SearchResponse, SourceStatus, Track, TrackSource } from "../types";
import { searchArchive } from "./archive";
import { searchAudius } from "./audius";
import { jamendoEnabled, searchJamendo } from "./jamendo";
import { searchYouTube, youtubeEnabled } from "./youtube";

interface SourceDef {
  id: TrackSource;
  name: string;
  enabled: () => boolean;
  note: string;
  search: (query: string, limit: number) => Promise<Track[]>;
}

/** Order matters: results are interleaved round-robin starting with the first source. */
const SOURCES: SourceDef[] = [
  { id: "youtube", name: "YouTube", enabled: youtubeEnabled, note: "Set YOUTUBE_API_KEY to enable infinite track variety.", search: searchYouTube },
  { id: "audius", name: "Audius", enabled: () => true, note: "Open streaming catalogue, no key required.", search: searchAudius },
  { id: "jamendo", name: "Jamendo", enabled: jamendoEnabled, note: "Set JAMENDO_CLIENT_ID to enable Creative-Commons music.", search: searchJamendo },
  { id: "archive", name: "Internet Archive", enabled: () => true, note: "Open audio archive, no key required.", search: searchArchive },
];

export function sourceStatuses(): SourceStatus[] {
  return SOURCES.map(({ id, name, enabled, note }) => ({ id, name, enabled: enabled(), note }));
}

function interleave(lists: Track[][]): Track[] {
  const seen = new Set<string>();
  const seenTitles = new Set<string>();
  const out: Track[] = [];
  const longest = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < longest; i++) {
    for (const list of lists) {
      const track = list[i];
      if (!track || seen.has(track.key)) continue;
      const titleKey = `${track.title}|${track.artist}`.toLowerCase();
      if (seenTitles.has(titleKey)) continue;
      seen.add(track.key);
      seenTitles.add(titleKey);
      out.push(track);
    }
  }
  return out;
}

/** Aggregates every enabled source in parallel; a failing source never fails the search. */
export async function searchAll(query: string, perSource = 12): Promise<SearchResponse> {
  const active = SOURCES.filter((s) => s.enabled());
  const settled = await Promise.allSettled(active.map((s) => s.search(query, perSource)));
  const lists: Track[][] = [];
  const sources: SearchResponse["sources"] = [];
  settled.forEach((result, i) => {
    const id = active[i].id;
    if (result.status === "fulfilled") {
      lists.push(result.value);
      sources.push({ id, ok: true, count: result.value.length });
    } else {
      console.warn(`[search] ${id} failed:`, result.reason instanceof Error ? result.reason.message : result.reason);
      lists.push([]);
      sources.push({ id, ok: false, count: 0 });
    }
  });
  return { query, tracks: interleave(lists), sources };
}

export { interleave };
