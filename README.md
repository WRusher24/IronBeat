# IronBeat

Mobile-first workout music PWA. Search, tap, lift.

- **Stack:** Next.js 15 (App Router) · Tailwind CSS · Drizzle ORM · Neon PostgreSQL · custom HTML5 + YouTube IFrame audio engine
- **Highlights:** instant search with an autoplay queue, one-tap recent-search chips, a mood "vibe deck", training folders, Smart Shuffle, three themes, lock-screen controls through the Media Session API, installable on iPhone.

Docs:

- [`DEPLOYS_GUIDE.md`](./DEPLOYS_GUIDE.md) – run locally and deploy to Vercel
- [`USER_GUIDE.md`](./USER_GUIDE.md) – how to use the app

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL and AUTH_SECRET
npm run db:migrate
npm run dev
```
