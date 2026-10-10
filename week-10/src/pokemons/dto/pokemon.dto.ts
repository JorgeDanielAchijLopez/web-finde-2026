import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationQuerySchema } from '../../common/dto/pagination-query.dto.js';
import { PokemonTypeSchema } from '../../pokemon-types/dto/pokemon-type.dto.js';

export const TrainerSummarySchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  hometown: z.string(),
});

export const PokemonSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  height: z.number().int().nonnegative().describe('Height in decimetres'),
  weight: z.number().int().nonnegative().describe('Weight in hectograms'),
  imageUrl: z.string().url(),
  types: z.array(PokemonTypeSchema),
  trainer: TrainerSummarySchema.nullable(),
});

export const CreatePokemonSchema = z.object({
  name: z.string().trim().min(1).max(50),
  height: z.number().int().nonnegative().max(1000),
  weight: z.number().int().nonnegative().max(10000),
  imageUrl: z.string().url(),
  typeIds: z
    .array(z.number().int().positive())
    .min(1)
    .describe('IDs of elemental types this pokemon has'),
  trainerId: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional()
    .describe('Optional trainer that currently owns this pokemon'),
});

export const UpdatePokemonSchema = CreatePokemonSchema.partial();

export const PokemonListQuerySchema = PaginationQuerySchema.extend({
  typeId: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .describe('Only return pokemon that have this type'),
  trainerId: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .describe('Only return pokemon assigned to this trainer'),
});

export const PokemonListSchema = z.object({
  items: z.array(PokemonSchema),
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
});

export class PokemonDto extends createZodDto(PokemonSchema) {}
export class CreatePokemonDto extends createZodDto(CreatePokemonSchema) {}
export class UpdatePokemonDto extends createZodDto(UpdatePokemonSchema) {}
export class PokemonListQueryDto extends createZodDto(PokemonListQuerySchema) {}
export class PokemonListDto extends createZodDto(PokemonListSchema) {}
