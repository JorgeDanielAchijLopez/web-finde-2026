import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const HealthSchema = z.object({
  name: z.string().describe('API name'),
  version: z.string().describe('API version'),
  docs: z.string().describe('OpenAPI / Swagger UI path'),
  resources: z.array(z.string()).describe('Root paths for the main resources'),
});

export class HealthDto extends createZodDto(HealthSchema) {}
