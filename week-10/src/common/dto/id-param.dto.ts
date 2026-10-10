import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const IdParamSchema = z.object({
  id: z.coerce
    .number()
    .int()
    .positive()
    .describe('Numeric identifier of the resource'),
});

export class IdParamDto extends createZodDto(IdParamSchema) {}
