export const USER_AGENT = "IronBeat/1.0 (workout music PWA)";

export async function fetchJson<T>(url: string, opts: { timeoutMs?: number; revalidate?: number } = {}): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(opts.timeoutMs ?? 6000),
    next: { revalidate: opts.revalidate ?? 300 },
  });
  if (!res.ok) throw new Error(`${new URL(url).host} responded with ${res.status}`);
  return (await res.json()) as T;
}

export function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}
