import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "IronBeat – Workout Music",
    short_name: "IronBeat",
    description: "Instant workout music. Search, tap, lift.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F5F2EC",
    theme_color: "#F5F2EC",
    categories: ["music", "fitness"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Search", short_name: "Search", url: "/", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Moods", short_name: "Moods", url: "/moods", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Training folders", short_name: "Folders", url: "/playlists", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
