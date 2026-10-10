import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const hexColorSchema = z
  .string()
  .regex(/^#([0-9A-Fa-f]{6})$/, 'Color must be a hex value like #F08030');

export const PokemonTypeSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  color: hexColorSchema,
});

export const CreatePokemonTypeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(30)
    .describe('Elemental type name, for example Fire'),
  color: hexColorSchema.describe('Display color in #RRGGBB format'),
});

export const UpdatePokemonTypeSchema = CreatePokemonTypeSchema.partial();

export const PokemonTypeListSchema = z.object({
  items: z.array(PokemonTypeSchema),
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
});

export class PokemonTypeDto extends createZodDto(PokemonTypeSchema) {}
export class CreatePokemonTypeDto extends createZodDto(
  CreatePokemonTypeSchema,
) {}
export class UpdatePokemonTypeDto extends createZodDto(
  UpdatePokemonTypeSchema,
) {}
export class PokemonTypeListDto extends createZodDto(PokemonTypeListSchema) {}
