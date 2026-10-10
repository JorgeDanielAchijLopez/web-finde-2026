import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pokemon } from '../pokemons/pokemon.entity.js';
import { PokemonsModule } from '../pokemons/pokemons.module.js';
import { Trainer } from './trainer.entity.js';
import { TrainersController } from './trainers.controller.js';
import { TrainersService } from './trainers.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Trainer, Pokemon]), PokemonsModule],
  controllers: [TrainersController],
  providers: [TrainersService],
  exports: [TrainersService],
})
export class TrainersModule {}
