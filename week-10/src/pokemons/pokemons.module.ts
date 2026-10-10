import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PokemonTypesModule } from '../pokemon-types/pokemon-types.module.js';
import { PokemonType } from '../pokemon-types/pokemon-type.entity.js';
import { Trainer } from '../trainers/trainer.entity.js';
import { Pokemon } from './pokemon.entity.js';
import { PokemonsController } from './pokemons.controller.js';
import { PokemonsService } from './pokemons.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pokemon, PokemonType, Trainer]),
    PokemonTypesModule,
  ],
  controllers: [PokemonsController],
  providers: [PokemonsService],
  exports: [PokemonsService],
})
export class PokemonsModule {}
