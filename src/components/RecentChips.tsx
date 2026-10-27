"use client";

import { IconBolt } from "./icons";

const SUGGESTIONS = ["workout nasheed", "brazilian phonk", "gym motivational speech", "heavy bass", "synthwave workout"];

export function RecentChips({
  history,
  activeQuery,
  disabled,
  onLaunch,
}: {
  history: { query: string; count: number }[] | null;
  activeQuery: string | null;
  disabled: boolean;
  onLaunch: (query: string) => void;
}) {
  const items = history && history.length > 0 ? history.map((h) => h.query) : SUGGESTIONS;
  const isSuggestions = !history || history.length === 0;

  return (
    <section aria-label={isSuggestions ? "Suggested searches" : "Recent searches"}>
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-muted">
        {isSuggestions ? "Try one-tap pump" : "One-tap pump"}
      </h2>
      <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 scrollbar-none">
        {history === null
          ? [0, 1, 2].map((i) => <span key={i} className="h-12 w-32 shrink-0 animate-pulse rounded-full bg-fg/10" />)
          : items.map((q) => (
              <button
                key={q}
                type="button"
                disabled={disabled}
                onClick={() => onLaunch(q)}
                className={`flex min-h-12 shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-full px-5 text-[15px] font-semibold transition active:scale-95 disabled:opacity-60 ${
                  activeQuery === q ? "bg-accent text-accent-fg" : "bg-card text-card-fg"
                }`}
              >
                <IconBolt size={14} className={activeQuery === q ? "" : "text-accent"} />
                {q}
              </button>
            ))}
      </div>
    </section>
  );
}
