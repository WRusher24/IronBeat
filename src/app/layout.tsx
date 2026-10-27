import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { ThemeProvider } from "@/components/ThemeProvider";
import { DEFAULT_THEME, isThemeId, themeColorFor, THEME_COOKIE } from "@/lib/themes";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "IronBeat", template: "%s · IronBeat" },
  description: "Instant workout music, mood playlists and smart shuffle built for the gym.",
  applicationName: "IronBeat",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "IronBeat", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  other: { "mobile-web-app-capable": "yes" },
};

export async function generateViewport(): Promise<Viewport> {
  const stored = (await cookies()).get(THEME_COOKIE)?.value;
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    viewportFit: "cover",
    themeColor: themeColorFor(isThemeId(stored) ? stored : DEFAULT_THEME),
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const stored = (await cookies()).get(THEME_COOKIE)?.value;
  const theme = isThemeId(stored) ? stored : DEFAULT_THEME;
  return (
    <html lang="en" data-theme={theme}>
      <body>
        <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
