import type { Metadata } from "next";
import { MOODS } from "@/lib/moods";
import { AppHeader } from "@/components/app-header";
import { MoodCard } from "@/components/mood-card";

export const metadata: Metadata = { title: "Moods" };

export default function MoodsPage() {
  return (
    <>
      <AppHeader title="Vibe deck" />
      <p className="-mt-2 mb-5 text-sm text-muted">Tap a mood. The music starts instantly and keeps rolling.</p>
      <div className="grid grid-cols-2 gap-3">
        {MOODS.map((mood) => (
          <MoodCard key={mood.id} mood={mood} />
        ))}
      </div>
    </>
  );
}
