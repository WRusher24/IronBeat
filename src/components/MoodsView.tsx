"use client";

import { useState } from "react";
import { MOODS, pickQuery, type Mood } from "@/lib/moods";
import { MoodGrid } from "./MoodGrid";
import { PageHeader } from "./PageHeader";
import { Results } from "./Results";
import { SmartShuffleCard } from "./HomeView";
import { useLaunch } from "./useLaunch";

export function MoodsView() {
  const launcher = useLaunch();
  const [activeMood, setActiveMood] = useState<string | null>(null);

  const launchMood = (mood: Mood) => {
    setActiveMood(mood.id);
    void launcher.launch(pickQuery(mood), { record: false, label: `${mood.emoji} ${mood.title}` });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Vibe deck" subtitle="Pick your energy. The music starts instantly." />
      <MoodGrid moods={MOODS} activeId={activeMood} disabled={launcher.busy} onLaunch={launchMood} />
      <SmartShuffleCard />
      <Results state={launcher} />
    </div>
  );
}
