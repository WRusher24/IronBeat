"use client";

import { useCallback, useState } from "react";
import { getPlayer } from "@/lib/player/store";
import type { Track } from "@/lib/types";

export interface LaunchState {
  tracks: Track[];
  label: string | null;
  query: string | null;
  busy: boolean;
  error: string | null;
  empty: boolean;
}

/** Runs a search, immediately starts playback, and exposes the result list for display. */
export function useLaunch(onRecorded?: () => void) {
  const [state, setState] = useState<LaunchState>({ tracks: [], label: null, query: null, busy: false, error: null, empty: false });

  const launch = useCallback(
    async (query: string, opts: { record: boolean; label?: string }) => {
      // playQuery() unlocks audio synchronously, so this must be called straight from a tap handler.
      setState((s) => ({ ...s, busy: true, error: null, empty: false, query, label: opts.label ?? query }));
      try {
        const tracks = await getPlayer().playQuery(query, opts);
        setState({ tracks, label: opts.label ?? query, query, busy: false, error: null, empty: tracks.length === 0 });
        if (opts.record && tracks.length > 0) onRecorded?.();
      } catch (err) {
        setState((s) => ({ ...s, busy: false, error: err instanceof Error ? err.message : "Search failed." }));
      }
    },
    [onRecorded],
  );

  return { ...state, launch };
}
