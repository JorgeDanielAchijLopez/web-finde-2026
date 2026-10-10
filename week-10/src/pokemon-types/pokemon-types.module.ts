import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pokemon } from '../pokemons/pokemon.entity.js';
import { PokemonTypesController } from './pokemon-types.controller.js';
import { PokemonTypesService } from './pokemon-types.service.js';
import { PokemonType } from './pokemon-type.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([PokemonType, Pokemon])],
  controllers: [PokemonTypesController],
  providers: [PokemonTypesService],
  exports: [PokemonTypesService],
})
export class PokemonTypesModule {}
