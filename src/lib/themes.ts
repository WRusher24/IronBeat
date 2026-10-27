export const THEME_COOKIE = "ib-theme";

export const THEMES = [
  {
    id: "warm-neutral",
    name: "Warm Neutral",
    description: "Soft cream with warm amber accents",
    themeColor: "#F5F2EC",
    swatch: { bg: "#F5F2EC", card: "#1C1C1E", accent: "#D4A373" },
  },
  {
    id: "monochrome-ink",
    name: "Monochrome Ink",
    description: "High-contrast editorial black and white",
    themeColor: "#0B0B0C",
    swatch: { bg: "#0B0B0C", card: "#19191B", accent: "#F2F0EB" },
  },
  {
    id: "sunset-glow",
    name: "Sunset Glow",
    description: "Cream with sunset orange energy",
    themeColor: "#FBF6EE",
    swatch: { bg: "#FBF6EE", card: "#1C1C1E", accent: "#E65F2B" },
  },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
export const DEFAULT_THEME: ThemeId = "warm-neutral";

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}

export function themeColorFor(id: string): string {
  return THEMES.find((t) => t.id === id)?.themeColor ?? THEMES[0].themeColor;
}
