"use client";

import { useEffect, useState, type FormEvent } from "react";
import { IconClose, IconSearch } from "./icons";

export function SearchHero({
  busy,
  initialQuery = "",
  onSearch,
}: {
  busy: boolean;
  initialQuery?: string;
  onSearch: (query: string) => void;
}) {
  const [value, setValue] = useState(initialQuery);
  useEffect(() => setValue(initialQuery), [initialQuery]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (q.length >= 2) {
      (document.activeElement as HTMLElement | null)?.blur();
      onSearch(q);
    }
  }

  return (
    <form onSubmit={submit} role="search" className="card-surface flex items-center gap-2 p-2 pl-5 shadow-xl">
      <IconSearch size={22} className="shrink-0 text-card-muted" />
      <input
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search any track or vibe"
        enterKeyHint="search"
        inputMode="search"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={100}
        aria-label="Search music"
        className="min-h-12 min-w-0 flex-1 bg-transparent text-[17px] text-card-fg placeholder:text-card-muted focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" onClick={() => setValue("")} aria-label="Clear search" className="grid size-10 shrink-0 place-items-center rounded-full text-card-muted">
          <IconClose size={18} />
        </button>
      )}
      <button type="submit" disabled={busy || value.trim().length < 2} className="btn-accent shrink-0">
        {busy ? "…" : "Play"}
      </button>
    </form>
  );
}
