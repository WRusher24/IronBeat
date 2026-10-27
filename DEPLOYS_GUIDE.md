# IronBeat – Deployment & Testing Guide

IronBeat is a Next.js 15 (App Router) app backed by Neon PostgreSQL through Drizzle ORM.

## 1. Architecture at a glance

| Layer | Details |
| --- | --- |
| UI | Next.js App Router, React 19, Tailwind CSS, theme tokens as CSS variables (`app/globals.css`) |
| Auth | Email/password, bcrypt hashes, signed JWT in an `httpOnly` cookie (`jose`); `middleware.ts` guards every page and API route |
| Data | Drizzle ORM + `@neondatabase/serverless` (HTTP driver). Tables: `users`, `playlists`, `playlist_tracks`, `favorites`, `search_history` |
| Isolation | Every query is scoped by the session's `user_id`; playlist routes verify ownership before touching rows |
| Audio | `lib/audio-engine.ts`: one persistent `HTMLAudioElement` for direct streams + the YouTube IFrame Player API for YouTube tracks |
| Search | `lib/search.ts` merges YouTube (optional key), Jamendo (optional key), Openverse and the Internet Archive, and caches results for 10 minutes |
| PWA | `app/manifest.ts`, `public/sw.js`, Apple touch icons in `public/icons/` |

## 2. Prerequisites

- Node.js 20 or newer
- A free [Neon](https://neon.tech) project (PostgreSQL)
- Optional but recommended: a [YouTube Data API v3 key](https://console.cloud.google.com/apis/library/youtube.googleapis.com) for unlimited track variety

## 3. Environment variables

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | Neon connection string, e.g. `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` |
| `AUTH_SECRET` | yes | Random string (32+ chars) used to sign session cookies. Generate with `openssl rand -base64 48` |
| `YOUTUBE_API_KEY` | no | Enables YouTube search and IFrame playback. Without it, search uses the open sources only |
| `JAMENDO_CLIENT_ID` | no | Enables full-length Creative Commons music from Jamendo ([developer portal](https://devportal.jamendo.com)) |

> YouTube search costs 100 quota units per query (default quota: 10,000 per day, about 100 uncached searches). Results are cached for 10 minutes per query, and moods and chips reuse that cache.

## 4. Run locally

```bash
npm install
npm run db:migrate     # applies ./drizzle/*.sql to your Neon database
npm run dev            # http://localhost:3000
```

| Script | Purpose |
| --- | --- |
| `npm run typecheck` | TypeScript check |
| `npm run build && npm start` | Production build served locally (the service worker only registers in production builds) |
| `npm run db:generate` | Generate a new SQL migration after editing `db/schema.ts` |
| `npm run db:migrate` | Apply migrations (reads `.env.local`) |
| `npm run db:studio` | Browse data with Drizzle Studio |
| `npm run icons` | Regenerate all PWA / iPhone icons from the vector source in `scripts/generate-icons.mjs` |

### Manual test checklist

1. Open `/register`, create an account. You land on Home immediately (no approval step).
2. Search `workout nasheed` and press **Pump**. The first result plays and the rest is queued; let a track end to confirm the next one auto-plays.
3. Reload. Your search appears as a chip under the search bar; tap it to relaunch.
4. Scroll the Vibe deck on Home and tap a card. A mixed playlist starts.
5. Tap `+` on a track, create a folder, then open **Folders** and confirm the track is there.
6. Heart a few tracks, then use **Smart Shuffle**.
7. Switch themes from the header dropdown and from **Settings**; reload to confirm persistence.
8. Register a second account and confirm it sees none of the first account's folders, likes or chips.
9. On an iPhone (HTTPS required, so use your Vercel URL), start a non-YouTube track, lock the phone and confirm the lock-screen controls work.

## 5. Deploy to Vercel

1. Push this repository to GitHub.
2. In Vercel choose **Add New → Project** and import the repository. The Next.js preset is detected automatically.
3. Under **Environment Variables** add `DATABASE_URL`, `AUTH_SECRET` and optionally `YOUTUBE_API_KEY` and `JAMENDO_CLIENT_ID` for Production (and Preview if you want preview deployments to work).
4. Deploy. The repo defines a `vercel-build` script (`node scripts/migrate.mjs && next build`), so **database migrations are applied automatically on every deploy**. The build fails loudly if `DATABASE_URL` is missing.
5. Every push to the production branch redeploys through the GitHub integration; pull requests get preview URLs.

Production notes:

- Use a separate Neon branch for Preview deployments if you do not want test accounts mixed with real ones.
- Search routes set `maxDuration = 30`, which fits within Vercel's Hobby limits.
- The auth rate limiter is in-memory per serverless instance. For stricter protection add Vercel Firewall rate limits in front of `/api/auth/*`.

### PWA settings

- The manifest is served at `/manifest.webmanifest` and is excluded from the auth middleware so iOS and Android can always fetch it.
- `public/sw.js` is served with `Cache-Control: no-cache` (see `next.config.mjs`) so service-worker updates roll out immediately. It caches static assets and shows `public/offline.html` when the network is unavailable. API calls and audio are never cached.
- Icons live in `public/icons/`. The iOS icon (`apple-touch-icon.png`, 180×180) is a **fully opaque, full-bleed square**. iOS applies its own rounded mask, so there is no transparency and no pre-drawn border to clip. The glyph sits inside the central ~60% safe zone and the same artwork serves as the Android maskable icon. To change the logo, edit `scripts/generate-icons.mjs` and run `npm run icons`.
- A custom domain and HTTPS (automatic on Vercel) are required for installation and lock-screen controls.

## 6. Audio source behaviour and limitations

- **YouTube** tracks play through the official IFrame Player (shown as a small video in the full-screen player). Embedded YouTube audio does not keep playing on iOS when the screen locks or the app is minimised (Apple/YouTube restriction; downloading streams to work around it would violate YouTube's terms). The **Background-safe mode** setting (default on for iOS) filters YouTube tracks out so every queued track is a plain HTML5 stream. IronBeat keeps a silent media element alive and registers Media Session handlers to maximise lock-screen and AirPods control, but results vary by iOS version.
- **Internet Archive, Openverse and Jamendo** tracks are plain HTML5 audio streams and play reliably in the background with full lock-screen controls. Quality and relevance depend on what those open catalogues host.
- Search is intentionally submit-based (no search-as-you-type) to protect API quotas.
- Browsers only allow audio to start after a tap. IronBeat "primes" the audio element at the moment you tap Pump, a chip or a mood, so playback can begin when the search response arrives.

## 7. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `DATABASE_URL is not set` | Create `.env.local` (local) or add the variable in Vercel and redeploy |
| `AUTH_SECRET must be set…` | Add a random string of 16+ characters |
| Search returns few results | Add `YOUTUBE_API_KEY` (and optionally `JAMENDO_CLIENT_ID`) |
| Tracks skip immediately | The source blocked playback (embedding disabled, expired URL). IronBeat auto-skips to the next track |
| Home-screen icon looks stale on iPhone | Delete the icon, reload the site in Safari, add it to the Home Screen again (iOS caches icons aggressively) |
