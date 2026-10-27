import type { Metadata } from "next";
import { FavoritesView } from "@/components/FavoritesView";

export const metadata: Metadata = { title: "Liked tracks" };

export default function FavoritesPage() {
  return <FavoritesView />;
}
