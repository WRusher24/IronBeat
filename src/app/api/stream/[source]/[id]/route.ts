import { NextResponse } from "next/server";
import { resolveArchiveStream } from "@/lib/sources/archive";
import { resolveAudiusStream } from "@/lib/sources/audius";
import { resolveJamendoStream } from "@/lib/sources/jamendo";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ source: string; id: string }> };

/**
 * Same-origin redirect to the current audio URL for a track. Resolving at play time keeps
 * saved playlists working when CDN hosts rotate. Only whitelisted upstream hosts are returned.
 */
export async function GET(_req: Request, { params }: Ctx) {
  const { source, id } = await params;
  if (!/^[\w.\-@ ]{1,200}$/.test(id)) return NextResponse.json({ error: "Invalid track id." }, { status: 400 });

  try {
    let target: string | null = null;
    if (source === "audius") target = await resolveAudiusStream(id);
    else if (source === "archive") target = await resolveArchiveStream(id);
    else if (source === "jamendo") target = await resolveJamendoStream(id);
    else return NextResponse.json({ error: "Unknown source." }, { status: 404 });

    if (!target || !target.startsWith("https://")) {
      return NextResponse.json({ error: "No playable audio for this track." }, { status: 404 });
    }
    return NextResponse.redirect(target, {
      status: 302,
      headers: { "Cache-Control": "private, max-age=300" },
    });
  } catch {
    return NextResponse.json({ error: "Could not resolve the audio stream." }, { status: 502 });
  }
}
