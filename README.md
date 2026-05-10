# Store It

**Store it. Find it.** A simple home organization app for creatives.

Track where personal items are stored across recursive Locations with hotspot photos. Killer feature is "Where is it?" search.

## Stack

- Next.js 15 + React 19
- Payload CMS 3 (data layer + admin)
- Neon Postgres
- Cloudflare R2 (media storage)
- Vercel (hosting)

## Local Setup

```bash
npm install
npm run dev
```

First run will:
1. Auto-generate `src/app/(payload)/admin/importMap.js`
2. Sync the Payload schema to Neon (via `push: true`)
3. Start dev server at `http://localhost:3000`

Sign up at `/admin` to create the first user, or use the front-end `/signup` flow.

## Routes

- `/` — front-end home (top-level locations)
- `/login`, `/signup` — front-end auth
- `/admin` — Payload admin (gated)
- `/api/*` — Payload REST/GraphQL
