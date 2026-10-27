"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchJson, jsonBody } from "@/lib/client-api";
import { DEFAULT_THEME, isThemeId, themeColorFor, THEME_COOKIE, type ThemeId } from "@/lib/themes";

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (theme: ThemeId, opts?: { persist?: boolean }) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: ThemeId) {
  document.documentElement.dataset.theme = theme;
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = themeColorFor(theme);
  else {
    const el = document.createElement("meta");
    el.name = "theme-color";
    el.content = themeColorFor(theme);
    document.head.appendChild(el);
  }
}

export function ThemeProvider({ initialTheme, children }: { initialTheme: string; children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(isThemeId(initialTheme) ? initialTheme : DEFAULT_THEME);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next: ThemeId, opts?: { persist?: boolean }) => {
    setThemeState(next);
    applyTheme(next);
    if (opts?.persist !== false) {
      // Persisted to the account so the choice follows the user across devices.
      fetchJson("/api/settings", { method: "PATCH", ...jsonBody({ theme: next }) }).catch(() => undefined);
    }
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
