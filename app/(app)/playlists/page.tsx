import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";
import { PlaylistsView } from "@/components/playlists-view";

export const metadata: Metadata = { title: "Training folders" };

export default function PlaylistsPage() {
  return (
    <>
      <AppHeader title="Folders" />
      <PlaylistsView />
    </>
  );
}
