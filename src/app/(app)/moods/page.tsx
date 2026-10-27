import type { Metadata } from "next";
import { MoodsView } from "@/components/MoodsView";

export const metadata: Metadata = { title: "Moods" };

export default function MoodsPage() {
  return <MoodsView />;
}
