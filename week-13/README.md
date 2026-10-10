# Week 13 — Drizzle migrations with Hono and Zod

A small notes API that shows how Drizzle ORM migrations work end to end:

1. Define tables in TypeScript (`src/db/schema.ts`)
2. Generate SQL with `drizzle-kit generate`
3. Apply pending SQL on boot with `migrate()`
4. Validate HTTP input with Zod, then query through Drizzle and `better-sqlite3`

## Stack

- **Hono** — HTTP router and middleware (`logger`, `onError`)
- **Zod** + `@hono/zod-validator` — request validation
- **Drizzle ORM** — typed schema and query builder
- **better-sqlite3** — SQLite driver
- **drizzle-kit** — migration generation

## Migrations in this project

| File | Change |
| --- | --- |
| `drizzle/0000_create_authors_and_notes.sql` | Creates `authors` and `notes` |
| `drizzle/0001_add_notes_pinned.sql` | Adds `notes.pinned` (boolean stored as integer) |

The second migration is the teaching point: schema changes become SQL files you can review and commit, then apply later.

## Setup

```bash
npm install
npm run dev
```

On start, the app opens `./data/app.db` (or `DATABASE_URL`) and runs any pending migrations from `./drizzle`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the API with reload |
| `npm start` | Start the API once |
| `npm run db:generate` | Diff `schema.ts` and write a new SQL migration |
| `npm run db:migrate` | Apply migrations via drizzle-kit CLI |
| `npm test` | Run Vitest request tests against a temp DB |

## API

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/health` | Liveness |
| `GET` | `/notes` | Optional `?pinned=true\|false` |
| `GET` | `/notes/:id` | Single note |
| `POST` | `/notes` | Create note (+ author upsert by email) |
| `PATCH` | `/notes/:id` | Partial update |
| `DELETE` | `/notes/:id` | Delete note |

### Create example

```bash
curl -s http://localhost:3000/notes \
  -H 'content-type: application/json' \
  -d '{
    "title": "Migration notes",
    "body": "Pinned column came from 0001",
    "authorName": "Ada",
    "authorEmail": "ada@example.com",
    "pinned": true
  }'
```

Invalid bodies return `400` with Zod issues.

## Flow diagram

Open the Cursor canvas beside chat for request-path and migration-path diagrams:

[`drizzle-hono-flow.canvas.tsx`](/Users/yoel/.cursor/projects/Users-yoel-Code-umg-web-finde-2026-week-13/canvases/drizzle-hono-flow.canvas.tsx)
