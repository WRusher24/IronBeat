import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { ToastProvider } from "@/components/toast";
import { PlayerProvider } from "@/components/player-provider";
import { LibraryProvider } from "@/components/library-provider";
import { BottomNav } from "@/components/bottom-nav";
import { MiniPlayer } from "@/components/mini-player";
import { FullPlayer } from "@/components/full-player";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <ToastProvider>
      <PlayerProvider>
        <LibraryProvider>
          <div className="mx-auto min-h-dvh max-w-xl px-4 pb-[calc(10rem+env(safe-area-inset-bottom))]">{children}</div>
          <MiniPlayer />
          <FullPlayer />
          <BottomNav />
        </LibraryProvider>
      </PlayerProvider>
    </ToastProvider>
  );
}
