import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { createDb, getDefaultDatabaseUrl } from "./db/client.js";

const databaseUrl = process.env.DATABASE_URL ?? getDefaultDatabaseUrl();
const db = createDb(databaseUrl);
const app = createApp(db);

const port = Number(process.env.PORT ?? 3001);

console.log(`Notes API listening on http://localhost:${port}`);
console.log(`Database: ${databaseUrl}`);

serve({
  fetch: app.fetch,
  port,
});
