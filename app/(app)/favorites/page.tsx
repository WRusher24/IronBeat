import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";
import { FavoritesView } from "@/components/favorites-view";

export const metadata: Metadata = { title: "Liked" };

export default function FavoritesPage() {
  return (
    <>
      <AppHeader title="Liked" />
      <FavoritesView />
    </>
  );
}
