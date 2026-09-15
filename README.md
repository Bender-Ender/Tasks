# Tasks

A personal task tracker. One URL that works as a desktop app in a browser tab and as an installable
app on a phone home screen, backed by a single shared datastore.

## Stack

React 19 + TypeScript + Vite + Tailwind v4 on the front, a Cloudflare Worker (Hono) + D1 behind,
served as one Worker with static assets. One `wrangler deploy`.

```
src/          the SPA
worker/       the API — Hono routes, D1 queries, identity
shared/       Zod schemas and the fractional-ordering helpers, used by both sides
migrations/   D1 schema
design/       design-canvas working files (see below)
tests/        unit tests for the pure logic
```

## Running it

```bash
npm install
npm run db:local          # apply migrations to the local D1
npm run dev               # http://localhost:5173 — SPA and API together
```

`npm run dev` runs the real Worker against a real local D1 through the Cloudflare Vite plugin, so
there is no mock API to drift out of step.

```bash
npm run typecheck
npm test                  # unit tests
npm run shot              # screenshots at phone and desktop widths, light and dark
npm run build
```

## Data model

Tasks carry a title (≤100 chars, the only required field), an optional description (≤500), a
completion flag, an optional deadline (date only), one optional category, and a sticky `is_today`
flag. Sub-tasks (≤50 chars) hang off a task with their own completion flags.

`is_today` is deliberately dumb: nothing sets or clears it but the user. Ordering is a float
`sort_order` so a drag-and-drop reorder writes exactly one row — see `shared/order.ts`.

Deletes are soft (`deleted_at`).

## Identity

One person uses this app. Cloudflare Access decides who reaches it at all and the app itself never
handles a credential; past that gate `worker/auth.ts` returns a single constant owner, and every
query is scoped by that `user_id`.

Identity used to be the Access email, gated on an `ENVIRONMENT` var, and both drifted. `wrangler
deploy` replaces a Worker's vars with whatever the committed config declares, so a deploy dropped
the var and sent every query to the fallback user; Access signs in automatically and asserts
whichever address it likes, which split the rows across two emails. Each time the tasks were still
there and the app could not see them. A constant cannot be lost by a deploy or changed by a
sign-in. The `user_id` column and its indexes are untouched, so per-user identity can come back
without a schema change — see `migrations/0003_single_owner.sql`.

## Design

`design/` holds the working files for the design canvas — `build.mjs` assembles the `.dc.html`
artboards from one shared theme, and `canvas.json` lays them out. Rebuild with `node build.mjs`
from that directory.
