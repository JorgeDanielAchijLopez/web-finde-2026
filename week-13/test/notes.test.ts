import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { createDb, type AppDatabase } from "../src/db/client.js";

describe("notes API", () => {
  let tempDir: string;
  let db: AppDatabase;
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    tempDir = mkdtempSync(join(tmpdir(), "notes-api-"));
    db = createDb(join(tempDir, "test.db"));
    app = createApp(db);
  });

  afterAll(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("creates a note after migrations, including the pinned column", async () => {
    const response = await app.request("/notes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "First note",
        body: "Hello from migrations",
        authorName: "Ada Lovelace",
        authorEmail: "ada@example.com",
        pinned: true,
      }),
    });

    expect(response.status).toBe(201);

    const payload = await response.json();
    expect(payload.note).toMatchObject({
      title: "First note",
      body: "Hello from migrations",
      pinned: true,
    });
    expect(payload.note.id).toBeTypeOf("number");
    expect(payload.note.authorId).toBeTypeOf("number");

    const read = await app.request(`/notes/${payload.note.id}`);
    expect(read.status).toBe(200);

    const readPayload = await read.json();
    expect(readPayload.note.pinned).toBe(true);
    expect(readPayload.note.authorEmail).toBe("ada@example.com");
  });

  it("returns 400 when Zod validation fails", async () => {
    const response = await app.request("/notes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "",
        body: "missing author fields",
      }),
    });

    expect(response.status).toBe(400);

    const payload = await response.json();
    expect(payload.error).toBe("Validation failed");
    expect(payload.issues).toBeDefined();
  });

  it("filters notes by the pinned query param", async () => {
    await app.request("/notes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Loose note",
        body: "not pinned",
        authorName: "Grace Hopper",
        authorEmail: "grace@example.com",
        pinned: false,
      }),
    });

    const pinnedOnly = await app.request("/notes?pinned=true");
    expect(pinnedOnly.status).toBe(200);

    const payload = await pinnedOnly.json();
    expect(payload.notes.length).toBeGreaterThanOrEqual(1);
    expect(payload.notes.every((note: { pinned: boolean }) => note.pinned)).toBe(
      true,
    );
  });
});
