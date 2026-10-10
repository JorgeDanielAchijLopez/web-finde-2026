import { Module } from '@nestjs/common';
import { PokemonTypesModule } from '../pokemon-types/pokemon-types.module.js';
import { PokemonsModule } from '../pokemons/pokemons.module.js';
import { TrainersModule } from '../trainers/trainers.module.js';
import { SeedService } from './seed.service.js';

@Module({
  imports: [PokemonTypesModule, PokemonsModule, TrainersModule],
  providers: [SeedService],
})
export class SeedModule {}
