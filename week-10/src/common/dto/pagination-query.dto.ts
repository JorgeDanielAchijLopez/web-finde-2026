import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const PaginationQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .optional()
    .describe('Case-insensitive name filter'),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(20)
    .describe('Maximum number of items to return'),
  offset: z.coerce
    .number()
    .int()
    .min(0)
    .default(0)
    .describe('Number of items to skip'),
});

export class PaginationQueryDto extends createZodDto(PaginationQuerySchema) {}
