import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { DEFAULT_THEME, THEME_COOKIE, isThemeId, themeById } from "@/lib/themes";
import { ServiceWorkerRegister } from "@/components/sw-register";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "IronBeat", template: "%s · IronBeat" },
  description: "Instant workout music. Search, tap, lift. Your private training soundtrack.",
  applicationName: "IronBeat",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "IronBeat", statusBarStyle: "default" },
  formatDetection: { telephone: false, email: false, address: false },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/apple-touch-icon-167.png", sizes: "167x167", type: "image/png" },
      { url: "/icons/apple-touch-icon-152.png", sizes: "152x152", type: "image/png" },
    ],
  },
};

async function currentTheme() {
  const value = (await cookies()).get(THEME_COOKIE)?.value;
  return isThemeId(value) ? value : DEFAULT_THEME;
}

export async function generateViewport(): Promise<Viewport> {
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    viewportFit: "cover",
    themeColor: themeById(await currentTheme()).background,
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const theme = await currentTheme();
  return (
    <html lang="en" data-theme={theme}>
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
