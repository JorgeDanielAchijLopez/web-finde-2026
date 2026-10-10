import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { AppDatabase } from "./db/client.js";
import { createNotesRoutes } from "./notes/routes.js";

export type AppEnv = {
  Variables: {
    db: AppDatabase;
  };
};

export function createApp(db: AppDatabase) {
  const app = new Hono<AppEnv>();

  // CORS Middleware
  app.use("*", cors());

  app.use("*", logger());
  app.use("*", async (c, next) => {
    c.set("db", db);
    await next();
  });

  app.onError((err, c) => {
    console.error(err);
    return c.json(
      {
        error: "Internal server error",
        message: err.message,
      },
      500,
    );
  });

  app.get("/health", (c) => c.json({ status: "ok" }));
  app.route("/notes", createNotesRoutes());

  return app;
}
