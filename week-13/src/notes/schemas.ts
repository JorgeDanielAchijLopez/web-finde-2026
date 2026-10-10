import { z } from "zod";

export const noteIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listNotesQuerySchema = z.object({
  pinned: z
    .enum(["true", "false", "0", "1"])
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }

      return value === "true" || value === "1";
    }),
});

export const createNoteBodySchema = z.object({
  title: z.string().trim().min(1).max(20),
  body: z.string().trim().min(1).max(10_000),
  authorName: z.string().trim().min(1).max(100),
  authorEmail: z.email(),
  pinned: z.boolean().optional().default(false),
});

export const updateNoteBodySchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    body: z.string().trim().min(1).max(10_000).optional(),
    pinned: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.body !== undefined ||
      value.pinned !== undefined,
    { message: "At least one field is required" },
  );
