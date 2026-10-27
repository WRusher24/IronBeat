import { trackId, type Track } from "@/lib/types";
import { fetchJson } from "./http";

interface AdvancedSearch {
  response?: { docs?: { identifier: string; title?: string; creator?: string | string[] }[] };
}

interface ArchiveMetadata {
  files?: { name: string; format?: string; length?: string; size?: string; source?: string }[];
}

const AUDIO_FORMATS = new Set(["VBR MP3", "128Kbps MP3", "64Kbps MP3", "MP3", "Ogg Vorbis"]);

function toSeconds(length: string | undefined): number | null {
  if (!length) return null;
  if (length.includes(":")) {
    return length.split(":").reduce((acc, part) => acc * 60 + Number(part), 0) || null;
  }
  const n = Math.round(Number(length));
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function resolveTrack(identifier: string, title: string, artist: string): Promise<Track | null> {
  const meta = await fetchJson<ArchiveMetadata>(`https://archive.org/metadata/${encodeURIComponent(identifier)}`);
  const playable = (meta.files ?? []).find(
    (f) => AUDIO_FORMATS.has(f.format ?? "") || /\.(mp3|ogg)$/i.test(f.name),
  );
  if (!playable) return null;
  const duration = toSeconds(playable.length);
  if (duration !== null && duration > 3 * 3600) return null;
  return {
    id: trackId("archive", identifier),
    source: "archive",
    sourceId: identifier,
    title,
    artist,
    thumbnail: `https://archive.org/services/img/${encodeURIComponent(identifier)}`,
    audioUrl: `https://archive.org/download/${encodeURIComponent(identifier)}/${playable.name
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`,
    durationSec: duration,
  };
}

export async function searchArchive(query: string, limit = 6): Promise<Track[]> {
  const tokens = query.replace(/["\\()[\]{}:^~*?]/g, " ").split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];
  const cleaned = tokens.join(" AND ");
  const url =
    "https://archive.org/advancedsearch.php?" +
    new URLSearchParams({
      q: `(${cleaned}) AND mediatype:audio`,
      rows: String(limit),
      output: "json",
    }) +
    "&fl[]=identifier&fl[]=title&fl[]=creator";
  const result = await fetchJson<AdvancedSearch>(url);
  const docs = result.response?.docs ?? [];
  const resolved = await Promise.allSettled(
    docs.map((d) =>
      resolveTrack(
        d.identifier,
        d.title ?? d.identifier,
        Array.isArray(d.creator) ? d.creator.join(", ") : (d.creator ?? "Internet Archive"),
      ),
    ),
  );
  return resolved.flatMap((r) => (r.status === "fulfilled" && r.value ? [r.value] : []));
}
