"use client";

import { api } from "@/lib/client-api";
import type { Mood } from "@/lib/moods";
import type { Track } from "@/lib/types";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/components/player-provider";
import { Spinner } from "@/components/ui";

export function MoodCard({ mood, className }: { mood: Mood; className?: string }) {
  const { launch, launching } = usePlayer();
  const loading = launching === mood.title;

  return (
    <button
      onClick={() =>
        void launch(mood.title, async () => {
          const data = await api<{ tracks: Track[] }>(`/api/mood/${mood.id}`);
          return data.tracks;
        })
      }
      disabled={launching !== null}
      className={cn(
        "relative flex min-h-36 flex-col justify-between overflow-hidden rounded-3xl bg-card p-4 text-left text-card-fg transition active:scale-[0.97] disabled:opacity-60",
        className,
      )}
    >
      <span className="text-3xl" aria-hidden>
        {mood.emoji}
      </span>
      <span>
        <span className="block text-[17px] font-extrabold leading-tight">{mood.title}</span>
        <span className="mt-1 block text-xs leading-snug text-card-muted">{mood.blurb}</span>
      </span>
      {loading && (
        <span className="absolute right-3 top-3 text-accent">
          <Spinner />
        </span>
      )}
      <span className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-accent/25" aria-hidden />
    </button>
  );
}
