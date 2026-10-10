import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { Hono } from "hono";
import type { AppDatabase } from "../db/client.js";
import { authors, notes } from "../db/schema.js";
import {
  createNoteBodySchema,
  listNotesQuerySchema,
  noteIdParamsSchema,
  updateNoteBodySchema,
} from "./schemas.js";

type NotesEnv = {
  Variables: {
    db: AppDatabase;
  };
};

function validationHook(
  result: { success: boolean; error?: { issues?: unknown } },
  c: Context,
) {
  if (!result.success) {
    return c.json(
      {
        error: "Validation failed",
        issues: result.error?.issues ?? result.error,
      },
      400,
    );
  }
}

export function createNotesRoutes() {
  const routes = new Hono<NotesEnv>();

  routes.get(
    "/",
    zValidator("query", listNotesQuerySchema, validationHook),
    async (c) => {
      const db = c.get("db");
      const { pinned } = c.req.valid("query");

      const rows =
        pinned === undefined
          ? await db
              .select({
                id: notes.id,
                title: notes.title,
                body: notes.body,
                authorId: notes.authorId,
                pinned: notes.pinned,
                createdAt: notes.createdAt,
                authorName: authors.name,
                authorEmail: authors.email,
              })
              .from(notes)
              .innerJoin(authors, eq(notes.authorId, authors.id))
          : await db
              .select({
                id: notes.id,
                title: notes.title,
                body: notes.body,
                authorId: notes.authorId,
                pinned: notes.pinned,
                createdAt: notes.createdAt,
                authorName: authors.name,
                authorEmail: authors.email,
              })
              .from(notes)
              .innerJoin(authors, eq(notes.authorId, authors.id))
              .where(eq(notes.pinned, pinned));

      return c.json({ notes: rows });
    },
  );

  routes.get(
    "/:id",
    zValidator("param", noteIdParamsSchema, validationHook),
    async (c) => {
      const db = c.get("db");
      const { id } = c.req.valid("param");

      const [note] = await db
        .select({
          id: notes.id,
          title: notes.title,
          body: notes.body,
          authorId: notes.authorId,
          pinned: notes.pinned,
          createdAt: notes.createdAt,
          authorName: authors.name,
          authorEmail: authors.email,
        })
        .from(notes)
        .innerJoin(authors, eq(notes.authorId, authors.id))
        .where(eq(notes.id, id))
        .limit(1);

      if (!note) {
        return c.json({ error: "Note not found" }, 404);
      }

      return c.json({ note });
    },
  );

  routes.post(
    "/",
    zValidator("json", createNoteBodySchema, validationHook),
    async (c) => {
      const db = c.get("db");
      const body = c.req.valid("json");

      const note = db.transaction((tx) => {
        const [existingAuthor] = tx
          .select()
          .from(authors)
          .where(eq(authors.email, body.authorEmail))
          .limit(1)
          .all();

        const author =
          existingAuthor ??
          tx
            .insert(authors)
            .values({
              name: body.authorName,
              email: body.authorEmail,
            })
            .returning()
            .get();

        return tx
          .insert(notes)
          .values({
            title: body.title,
            body: body.body,
            authorId: author.id,
            pinned: body.pinned,
          })
          .returning()
          .get();
      });

      return c.json({ note }, 201);
    },
  );

  routes.patch(
    "/:id",
    zValidator("param", noteIdParamsSchema, validationHook),
    zValidator("json", updateNoteBodySchema, validationHook),
    async (c) => {
      const db = c.get("db");
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");

      const [updated] = await db
        .update(notes)
        .set({
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.body !== undefined ? { body: body.body } : {}),
          ...(body.pinned !== undefined ? { pinned: body.pinned } : {}),
        })
        .where(eq(notes.id, id))
        .returning();

      if (!updated) {
        return c.json({ error: "Note not found" }, 404);
      }

      return c.json({ note: updated });
    },
  );

  routes.delete(
    "/:id",
    zValidator("param", noteIdParamsSchema, validationHook),
    async (c) => {
      const db = c.get("db");
      const { id } = c.req.valid("param");

      const [deleted] = await db
        .delete(notes)
        .where(eq(notes.id, id))
        .returning({ id: notes.id });

      if (!deleted) {
        return c.json({ error: "Note not found" }, 404);
      }

      return c.json({ deleted: true, id: deleted.id });
    },
  );

  return routes;
}
