"use client";

import type { Mood } from "@/lib/moods";

export function MoodGrid({
  moods,
  activeId,
  disabled,
  onLaunch,
}: {
  moods: Mood[];
  activeId: string | null;
  disabled: boolean;
  onLaunch: (mood: Mood) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {moods.map((mood) => {
        const active = activeId === mood.id;
        return (
          <button
            key={mood.id}
            type="button"
            disabled={disabled}
            onClick={() => onLaunch(mood)}
            aria-label={`Launch ${mood.title}`}
            className={`relative flex min-h-[132px] flex-col justify-between overflow-hidden rounded-3xl p-4 text-left transition active:scale-[0.97] disabled:opacity-70 ${
              active ? "bg-accent text-accent-fg" : "bg-card text-card-fg"
            }`}
          >
            <span className="text-3xl leading-none" aria-hidden="true">
              {mood.emoji}
            </span>
            <span>
              <span className="block font-display text-[17px] font-extrabold leading-tight">{mood.title}</span>
              <span className={`mt-1 block text-[13px] leading-snug ${active ? "opacity-80" : "text-card-muted"}`}>{mood.tagline}</span>
            </span>
            {active && disabled && <span className="absolute right-3 top-3 size-2.5 animate-ping rounded-full bg-accent-fg" />}
          </button>
        );
      })}
    </div>
  );
}
