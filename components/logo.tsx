import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="80 140 352 232" className={cn("h-6 w-auto", className)} aria-hidden fill="currentColor">
      <rect x="172" y="247" width="168" height="18" rx="9" />
      <rect x="100" y="161" width="32" height="190" rx="10" />
      <rect x="140" y="191" width="32" height="130" rx="10" />
      <rect x="340" y="191" width="32" height="130" rx="10" />
      <rect x="380" y="161" width="32" height="190" rx="10" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-xl font-black tracking-tight", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-card text-accent">
        <LogoMark className="h-4" />
      </span>
      IronBeat
    </span>
  );
}
