import type { Track } from "../types";
import { fetchJson } from "./http";

interface ArchiveSearch {
  response?: { docs?: { identifier: string; title?: string | string[]; creator?: string | string[] }[] };
}

interface ArchiveMetadata {
  files?: { name: string; format?: string; source?: string }[];
}

const first = (v: string | string[] | undefined, fallback: string) => (Array.isArray(v) ? v[0] : v) ?? fallback;

/** Internet Archive audio collection: open, keyless, long-form and free to stream. */
export async function searchArchive(query: string, limit: number): Promise<Track[]> {
  const q = `(${query.replace(/["()\\:]/g, " ")}) AND mediatype:audio AND -collection:(podcasts OR audio_bookspoetry)`;
  const params = new URLSearchParams({ q, rows: String(limit), output: "json", sort: "downloads desc" });
  for (const f of ["identifier", "title", "creator"]) params.append("fl[]", f);
  const res = await fetchJson<ArchiveSearch>(`https://archive.org/advancedsearch.php?${params}`, { revalidate: 1800 });
  return (res.response?.docs ?? []).map((d) => ({
    key: `archive:${d.identifier}`,
    source: "archive" as const,
    sourceId: d.identifier,
    title: first(d.title, d.identifier),
    artist: first(d.creator, "Internet Archive"),
    artwork: `https://archive.org/services/img/${encodeURIComponent(d.identifier)}`,
    duration: null,
  }));
}

/** Finds the best playable MP3 inside an archive.org item. */
export async function resolveArchiveStream(identifier: string): Promise<string | null> {
  const meta = await fetchJson<ArchiveMetadata>(`https://archive.org/metadata/${encodeURIComponent(identifier)}`, {
    timeoutMs: 8000,
    revalidate: 3600,
  });
  const mp3s = (meta.files ?? []).filter((f) => /\.mp3$/i.test(f.name));
  if (mp3s.length === 0) return null;
  const preferred = mp3s.find((f) => f.source === "original") ?? mp3s.find((f) => /VBR/i.test(f.format ?? "")) ?? mp3s[0];
  const path = preferred.name.split("/").map(encodeURIComponent).join("/");
  return `https://archive.org/download/${encodeURIComponent(identifier)}/${path}`;
}
