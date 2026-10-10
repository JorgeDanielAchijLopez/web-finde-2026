import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PokemonTypesService } from '../pokemon-types/pokemon-types.service.js';
import { PokemonsService } from '../pokemons/pokemons.service.js';
import { TrainersService } from '../trainers/trainers.service.js';

const ARTWORK =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly pokemonTypesService: PokemonTypesService,
    private readonly pokemonsService: PokemonsService,
    private readonly trainersService: TrainersService,
  ) {}

  async onModuleInit(): Promise<void> {
    const existing = await this.pokemonTypesService.findAll({
      limit: 1,
      offset: 0,
    });

    if (existing.total > 0) {
      return;
    }

    const fire = await this.pokemonTypesService.create({
      name: 'fire',
      color: '#F08030',
    });
    const water = await this.pokemonTypesService.create({
      name: 'water',
      color: '#6890F0',
    });
    const grass = await this.pokemonTypesService.create({
      name: 'grass',
      color: '#78C850',
    });
    const electric = await this.pokemonTypesService.create({
      name: 'electric',
      color: '#F8D030',
    });

    const ash = await this.trainersService.create({
      name: 'ash',
      hometown: 'Pallet Town',
    });
    const misty = await this.trainersService.create({
      name: 'misty',
      hometown: 'Cerulean City',
    });

    await this.pokemonsService.create({
      name: 'bulbasaur',
      height: 7,
      weight: 69,
      imageUrl: `${ARTWORK}/1.png`,
      typeIds: [grass.id],
    });
    await this.pokemonsService.create({
      name: 'charmander',
      height: 6,
      weight: 85,
      imageUrl: `${ARTWORK}/4.png`,
      typeIds: [fire.id],
    });
    await this.pokemonsService.create({
      name: 'squirtle',
      height: 5,
      weight: 90,
      imageUrl: `${ARTWORK}/7.png`,
      typeIds: [water.id],
      trainerId: misty.id,
    });
    await this.pokemonsService.create({
      name: 'pikachu',
      height: 4,
      weight: 60,
      imageUrl: `${ARTWORK}/25.png`,
      typeIds: [electric.id],
      trainerId: ash.id,
    });

    this.logger.log('Seeded types, trainers, and pokemons');
  }
}
