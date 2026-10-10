import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PokemonSchema } from '../../pokemons/dto/pokemon.dto.js';

export const TrainerSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  hometown: z.string(),
  pokemons: z.array(PokemonSchema),
});

export const CreateTrainerSchema = z.object({
  name: z.string().trim().min(1).max(50),
  hometown: z.string().trim().min(1).max(80),
});

export const ReplaceTrainerSchema = CreateTrainerSchema;

export const TrainerListSchema = z.object({
  items: z.array(TrainerSchema),
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
});

export class TrainerDto extends createZodDto(TrainerSchema) {}
export class CreateTrainerDto extends createZodDto(CreateTrainerSchema) {}
export class ReplaceTrainerDto extends createZodDto(ReplaceTrainerSchema) {}
export class TrainerListDto extends createZodDto(TrainerListSchema) {}
