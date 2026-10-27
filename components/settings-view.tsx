"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { api } from "@/lib/client-api";
import { Button } from "@/components/ui";
import { usePlayer } from "@/components/player-provider";
import { ThemePicker } from "@/components/theme-switcher";

export function SettingsView({ displayName, email }: { displayName: string; email: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const player = usePlayer();

  async function signOut() {
    setLoading(true);
    player.stop(); // the player now lives at the root, so end playback explicitly on sign-out
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-card p-5 text-card-fg">
        <p className="text-xs font-bold uppercase tracking-widest text-card-muted">Signed in as</p>
        <p className="mt-1 text-xl font-extrabold">{displayName}</p>
        <p className="text-sm text-card-muted">{email}</p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-extrabold">Theme</h2>
        <ThemePicker />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-extrabold">Lock-screen playback</h2>
        <button
          onClick={() => player.setBackgroundSafe(!player.backgroundSafe)}
          role="switch"
          aria-checked={player.backgroundSafe}
          className="flex min-h-16 w-full items-center justify-between gap-4 rounded-3xl border border-line p-4 text-left"
        >
          <span>
            <span className="block font-bold">Background-safe mode</span>
            <span className="block text-sm text-muted">
              Off by default. Turn on only if YouTube tracks stop when you lock the phone: it skips YouTube and plays open-source tracks, which iOS keeps playing.
            </span>
          </span>
          <span className={`flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition ${player.backgroundSafe ? "bg-accent" : "bg-line"}`}>
            <span className={`h-6 w-6 rounded-full bg-white shadow transition ${player.backgroundSafe ? "translate-x-6" : ""}`} />
          </span>
        </button>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-extrabold">Install on iPhone</h2>
        <ol className="list-decimal space-y-1 rounded-3xl border border-line p-5 pl-9 text-sm text-muted">
          <li>Open IronBeat in Safari.</li>
          <li>Tap the Share button.</li>
          <li>Choose “Add to Home Screen”, then tap Add.</li>
        </ol>
      </section>

      <Button variant="ghost" onClick={signOut} loading={loading} className="w-full">
        <LogOut className="h-5 w-5" /> Sign out
      </Button>
    </div>
  );
}
