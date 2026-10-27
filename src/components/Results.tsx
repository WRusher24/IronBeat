"use client";

import type { LaunchState } from "./useLaunch";
import { TrackList } from "./TrackList";

export function Results({ state }: { state: LaunchState }) {
  if (state.busy && state.tracks.length === 0) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Searching">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <span className="size-12 animate-pulse rounded-xl bg-fg/10" />
            <span className="flex-1 space-y-2">
              <span className="block h-3.5 w-3/4 animate-pulse rounded bg-fg/10" />
              <span className="block h-3 w-1/2 animate-pulse rounded bg-fg/10" />
            </span>
          </div>
        ))}
      </div>
    );
  }
  if (state.error) {
    return (
      <p role="alert" className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-600">
        {state.error}
      </p>
    );
  }
  if (state.empty) {
    return (
      <p className="rounded-2xl bg-fg/[0.06] px-4 py-6 text-center text-muted">
        No tracks found for “{state.query}”. Try a broader search, like a genre or artist.
      </p>
    );
  }
  if (state.tracks.length === 0 || !state.label) return null;
  return (
    <section aria-label="Results">
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2 className="font-display text-xl font-extrabold">{state.label}</h2>
        <span className="text-sm text-muted">{state.tracks.length} tracks · autoplay on</span>
      </div>
      <TrackList tracks={state.tracks} context={{ label: state.label, query: state.query ?? undefined }} />
    </section>
  );
}
