export type ThemeId = "warm" | "ink" | "sunset";

export interface ThemeDef {
  id: ThemeId;
  name: string;
  description: string;
  /** Used for <meta name="theme-color"> and preview swatches. */
  background: string;
  card: string;
  accent: string;
}

export const THEMES: ThemeDef[] = [
  {
    id: "warm",
    name: "Warm Neutral",
    description: "Soft cream with amber & gold accents",
    background: "#F5F2EC",
    card: "#1C1C1E",
    accent: "#D4A373",
  },
  {
    id: "ink",
    name: "Monochrome Ink",
    description: "High-contrast editorial black & white",
    background: "#0A0A0B",
    card: "#161618",
    accent: "#F4F4F2",
  },
  {
    id: "sunset",
    name: "Sunset Glow",
    description: "Cream with sunset orange punches",
    background: "#FBF6EE",
    card: "#1F1B1A",
    accent: "#E65F2B",
  },
];

export const DEFAULT_THEME: ThemeId = "warm";
export const THEME_COOKIE = "ib-theme";

export const isThemeId = (value: unknown): value is ThemeId =>
  typeof value === "string" && THEMES.some((t) => t.id === value);

export const themeById = (id: string | undefined | null): ThemeDef =>
  THEMES.find((t) => t.id === id) ?? THEMES[0];
