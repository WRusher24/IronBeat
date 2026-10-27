# IronBeat — Deployment & Operations Guide

IronBeat is a mobile-first workout music PWA built with **Next.js 15 (App Router)**, **Tailwind CSS 3**, **Drizzle ORM** and **Neon PostgreSQL**. This guide covers running it locally, testing it, and deploying it to Vercel.

---

## 1. Architecture at a glance

```
src/
  app/
    (auth)/login, register     Public pages (email + password)
    (app)/                     Authenticated shell: Home, Moods, Playlists, Favorites, Settings
    api/                       Route handlers (auth, search, history, playlists, favorites,
                               smart-shuffle, settings, sources, stream)
    manifest.ts                Web App Manifest
  components/                  UI (mini-player, full player, track lists, sheets, theme switcher…)
  db/schema.ts, db/index.ts    Drizzle schema + lazily-connected client (Neon HTTP or node-postgres)
  lib/
    session.ts                 Signed JWT session cookie (edge-safe, `jose`)
    api.ts                     Auth guard + uniform error handling for route handlers
    sources/                   Audio providers: YouTube, Audius, Jamendo, Internet Archive
    player/engine.ts           HTML5 <audio> + YouTube IFrame playback engine
    player/store.ts            Queue / autoplay / repeat state + Media Session API integration
    smart-shuffle.ts           Mix builder driven by top searches + favourites
  middleware.ts                Route protection + same-origin check on API mutations
public/
  sw.js                        Service worker (app shell + static assets; never caches API/audio)
  icons/                       Generated app icons (see section 6)
drizzle/                       SQL migrations
```

### Data model (all rows are owned by a user; every query filters on `user_id`)

| Table | Purpose | Key constraints |
|---|---|---|
| `users` | Account, bcrypt password hash, theme preference | unique `email` |
| `playlists` | Named training folders | FK → `users` (cascade) |
| `playlist_tracks` | Track snapshots inside a playlist, ordered by `position` | unique (`playlist_id`, `track_key`) |
| `favorites` | Liked tracks | unique (`user_id`, `track_key`) |
| `search_history` | Successful searches with a usage `count` (powers chips + Smart Shuffle) | unique (`user_id`, `query`) |

### Security model

- Passwords are hashed with bcrypt (cost 12). Sessions are HS256 JWTs in an `httpOnly`, `SameSite=Lax`, `Secure` (in production) cookie valid for 30 days.
- Every API route calls `requireUser()` and scopes all reads/writes by the authenticated user id; accessing another user's playlist returns `404`.
- Mutating API calls with a mismatching `Origin` header are rejected in middleware.
- Login and registration are rate-limited (in-memory, per serverless instance).
- Stream redirects (`/api/stream/...`) only ever redirect to `https://` URLs resolved from the provider APIs.

---

## 2. Prerequisites

- **Node.js 20 or newer** (`node -v`)
- **npm 10+**
- A **Neon** account (free tier is fine): <https://neon.tech>
- Optional: a Google Cloud project for the YouTube Data API, and a free Jamendo client id

---

## 3. Run it locally

### 3.1 Install

```bash
git clone https://github.com/WRusher24/IronBeat2.git
cd IronBeat2
npm install
```

### 3.2 Create the database (Neon)

1. In the Neon console create a project (any region close to you / your Vercel region).
2. Open **Dashboard → Connect** and copy the **pooled** connection string. It looks like:
   `postgresql://USER:PASSWORD@ep-xxxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require`

### 3.3 Configure environment variables

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | Neon connection string from step 3.2 |
| `AUTH_SECRET` | yes | Random string, ≥ 32 chars. Generate: `openssl rand -base64 48`. Changing it signs everyone out. |
| `YOUTUBE_API_KEY` | no | Enables YouTube search + embedded playback (see section 7) |
| `JAMENDO_CLIENT_ID` | no | Enables Creative-Commons tracks from Jamendo |
| `DB_DRIVER` | no | `neon` (HTTP) or `pg` (TCP). Auto-detected: hosts ending in `neon.tech` use the Neon HTTP driver, anything else uses `pg`. |

Without any optional keys the app still works: **Audius** and the **Internet Archive** need no credentials.

### 3.4 Create the tables

```bash
npm run db:migrate      # applies drizzle/0000_init.sql
```

(`npm run db:push` also works for quick prototyping, but migrations are the recommended path.)

### 3.5 Start the app

```bash
npm run dev
```

Open <http://localhost:3000>, create an account, and you are in — there is no approval gate.

> **Service worker:** it is only registered in production builds. To test PWA behaviour locally run `npm run build && npm start`.

### 3.6 Using a local PostgreSQL instead of Neon

```bash
docker run --name ironbeat-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ironbeat -p 5432:5432 -d postgres:16
# .env.local
DATABASE_URL=postgres://postgres:postgres@localhost:5432/ironbeat
npm run db:migrate
```

The `pg` driver is selected automatically for non-Neon hosts.

### 3.7 Quality checks

```bash
npm run typecheck       # strict TypeScript
npm run build           # production build (works without a database connection)
```

### 3.8 Manual test checklist

1. Register two accounts (use a private window for the second). Confirm each only sees its own playlists, likes and chips.
2. Search “brazilian phonk” → the first result plays immediately and the rest queues; let a track end and confirm the next one starts.
3. Reload the home page → “brazilian phonk” appears as a quick-launch chip; tap it.
4. Launch each mood card; confirm the mini-player stays visible while navigating between tabs.
5. Create a playlist, add tracks from search via the ⋯ menu, rename it, remove a track, delete it.
6. Like a few tracks, run several searches, then tap **Smart Shuffle**.
7. Switch themes in **Settings** and from the palette dropdown on Home; reload to confirm persistence.
8. On a phone (same Wi-Fi: `npm run dev -- -H 0.0.0.0`, open `http://<your-LAN-IP>:3000`) check the lock-screen controls. For a full PWA install test use the deployed HTTPS URL.

---

## 4. Deploy to Vercel

### 4.1 Push the code to GitHub

The repository is <https://github.com/WRusher24/IronBeat2>. Vercel deploys from the `main` branch.

### 4.2 Import the project

1. Go to <https://vercel.com/new> and import the GitHub repository.
2. **Framework Preset:** Next.js (auto-detected). Build/Output settings stay at their defaults.
3. Under **Environment Variables** add (for *Production*, *Preview* and *Development*):

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | Neon **pooled** connection string |
   | `AUTH_SECRET` | `openssl rand -base64 48` (use a *different* value from local) |
   | `YOUTUBE_API_KEY` | optional |
   | `JAMENDO_CLIENT_ID` | optional |

4. Click **Deploy**.

### 4.3 Run database migrations on the production database

Run once from your machine (and again after every schema change), pointing at the production database:

```bash
DATABASE_URL="postgresql://…neon.tech/neondb?sslmode=require" npm run db:migrate
```

Alternatively, set Vercel’s **Build Command** to `npm run db:migrate && npm run build` so every deploy applies pending migrations automatically (the migrations are idempotent and only run once each).

> Tip: use a separate Neon branch for Preview deployments and set `DATABASE_URL` for the *Preview* environment to that branch, so test accounts never touch production data.

### 4.4 GitHub deployment integration

Once the repository is connected, Vercel automatically:

- deploys every push to `main` to **Production**,
- builds every pull request / other branch as a **Preview** with its own URL,
- lets you roll back instantly from the **Deployments** tab.

### 4.5 PWA settings on Vercel

Nothing extra is required — the PWA ships with the app:

- `/manifest.webmanifest` is generated by `src/app/manifest.ts` (name, `standalone` display, icons incl. a maskable icon).
- `public/sw.js` is served with `Cache-Control: no-cache` (configured in `next.config.mjs`) so updates reach users immediately.
- iOS requires **HTTPS** for installation features — Vercel provides it on `*.vercel.app` and on custom domains automatically.
- If you add a custom domain, update nothing in code; the manifest uses relative URLs.
- To change the cache strategy or force every client to refresh cached assets, bump `VERSION` in `public/sw.js`.

### 4.6 Region & performance

Set the Vercel Function Region (**Settings → Functions**) to the region closest to your Neon project to minimise query latency.

---

## 5. Audio sources

| Source | Credentials | Notes |
|---|---|---|
| **Audius** | none | Open catalogue of full-length independent tracks. Resolved to a live CDN host at play time. |
| **Internet Archive** | none | Open audio archive; the best MP3 in each item is chosen at play time. |
| **Jamendo** | `JAMENDO_CLIENT_ID` | Creative-Commons music. |
| **YouTube** | `YOUTUBE_API_KEY` | Embedded IFrame playback of embeddable music videos. |

Search runs all enabled sources in parallel with a 6 s timeout each; a failing source never breaks the search. Results are de-duplicated and interleaved round-robin so a single source cannot dominate. **Settings → Audio sources** shows which sources are active.

---

## 6. App icons

All icons are generated from one vector design by `scripts/generate-icons.mjs` (uses `sharp`):

```bash
npm run icons
```

| File | Size | Purpose |
|---|---|---|
| `apple-touch-icon.png` | 180×180 | iOS “Add to Home Screen” |
| `icon-192.png`, `icon-512.png` | 192, 512 | Manifest icons (`purpose: any`) |
| `maskable-512.png` | 512 | Android adaptive icon (`purpose: maskable`) |
| `favicon-32.png`, `icon.svg` | 32 / vector | Browser tab |

**Why the icon never looks clipped on iPhone:** iOS rounds the corners itself and fills transparency with black. The home-screen icons are therefore *opaque, full-bleed squares* with no baked-in rounding, and the artwork is kept inside the central ~60 % so every mask shape leaves it fully visible. To use a different logo, edit the SVG in the script and re-run `npm run icons`.

---

## 7. Enabling YouTube (optional)

1. In [Google Cloud Console](https://console.cloud.google.com/) create a project and enable **YouTube Data API v3**.
2. **Credentials → Create credentials → API key.** Restrict it to the YouTube Data API v3.
3. Add it as `YOUTUBE_API_KEY` locally and on Vercel.

Quota: the default 10,000 units/day allows roughly 100 uncached searches (a search costs 100 units). IronBeat caches identical searches for an hour.

**iOS note:** YouTube’s IFrame player is paused by iOS when the app is backgrounded or the screen is locked. For uninterrupted lock-screen playback, Audius, Jamendo and Internet Archive tracks use the native audio element, which keeps playing with the screen off.

---

## 8. Troubleshooting

| Symptom | Fix |
|---|---|
| `DATABASE_URL is not set` | Create `.env.local` (local) or add the variable in Vercel and redeploy. |
| `AUTH_SECRET must be set…` in production | Add a ≥ 32 char `AUTH_SECRET` in Vercel and redeploy. |
| `relation "users" does not exist` | Run `npm run db:migrate` against that database (section 4.3). |
| Search returns nothing | Check **Settings → Audio sources**; some networks block provider hosts. Try a broader query. |
| First tap plays nothing on iOS | Safari needs a user gesture; search/mood/chip taps already unlock audio — reload and tap again. |
| Old UI after a deploy on an installed PWA | Fully close and reopen the app; bump `VERSION` in `public/sw.js` if needed. |
| Edited icons not updating on iPhone | iOS caches home-screen icons: delete the icon and add it again. |

---

## 9. Command reference

| Command | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run typecheck` | TypeScript check |
| `npm run icons` | Regenerate app icons |
| `npm run db:generate` | Generate a new migration from `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:push` | Push schema directly (prototyping) |
| `npm run db:studio` | Browse the database |
