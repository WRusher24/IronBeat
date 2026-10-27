import type { Metadata } from "next";
import { PlaylistDetail } from "@/components/PlaylistDetail";

export const metadata: Metadata = { title: "Playlist" };

export default async function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PlaylistDetail id={id} />;
}
