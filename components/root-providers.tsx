"use client";

import type { ReactNode } from "react";
import { PlayerProvider } from "@/components/player-provider";
import { ToastProvider } from "@/components/toast";

/**
 * Mounted once in the root layout. The audio engine lives inside PlayerProvider, so route
 * transitions anywhere in the app (including auth ↔ app) never unmount or reset playback.
 */
export function RootProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <PlayerProvider>{children}</PlayerProvider>
    </ToastProvider>
  );
}
