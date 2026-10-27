"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { getPlayer, usePlayer } from "@/lib/player/store";
import { BottomNav } from "./BottomNav";
import { FullPlayer } from "./FullPlayer";
import { LibraryProvider } from "./LibraryProvider";
import { MiniPlayer } from "./MiniPlayer";

export function AppShell({ children }: { children: ReactNode }) {
  const player = usePlayer();
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hostRef.current) getPlayer().attachYouTubeHost(hostRef.current);
  }, []);

  const showVideo = player.expanded && player.current?.source === "youtube";

  return (
    <LibraryProvider>
      <div className="mx-auto min-h-dvh w-full max-w-xl px-4 pt-safe pb-[calc(10.5rem+env(safe-area-inset-bottom))]">{children}</div>
      <MiniPlayer />
      <BottomNav />
      <FullPlayer />
      {/*
        The YouTube iframe lives here permanently so it is never reloaded. It floats over the
        full player's video slot when expanded and is parked off-screen (still rendered at a
        valid size) otherwise, so playback continues while browsing.
      */}
      <div
        ref={hostRef}
        aria-hidden={!showVideo}
        className={
          showVideo
            ? "fixed left-1/2 top-[calc(env(safe-area-inset-top)+4.75rem)] z-[65] aspect-video w-[min(22rem,calc(100vw-2.5rem))] -translate-x-1/2 overflow-hidden rounded-3xl shadow-2xl sm:w-[28rem] [&>iframe]:size-full"
            : "pointer-events-none fixed -left-[9999px] top-0 h-[200px] w-[356px] [&>iframe]:size-full"
        }
      />
    </LibraryProvider>
  );
}
