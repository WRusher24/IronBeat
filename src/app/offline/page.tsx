import type { Metadata } from "next";

export const metadata: Metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="grid min-h-dvh place-items-center px-8 text-center">
      <div>
        <p className="font-display text-3xl font-bold">You&apos;re offline</p>
        <p className="mt-3 text-muted">IronBeat needs a connection to stream music. Reconnect and pull to refresh.</p>
      </div>
    </main>
  );
}
