import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PokemonTypesService } from '../pokemon-types/pokemon-types.service.js';
import { Trainer } from '../trainers/trainer.entity.js';
import {
  CreatePokemonDto,
  PokemonDto,
  PokemonListDto,
  PokemonListQueryDto,
  UpdatePokemonDto,
} from './dto/pokemon.dto.js';
import { Pokemon } from './pokemon.entity.js';

@Injectable()
export class PokemonsService {
  constructor(
    @InjectRepository(Pokemon)
    private readonly pokemons: Repository<Pokemon>,
    @InjectRepository(Trainer)
    private readonly trainers: Repository<Trainer>,
    private readonly pokemonTypesService: PokemonTypesService,
  ) {}

  async findAll(query: PokemonListQueryDto): Promise<PokemonListDto> {
    const qb = this.pokemons
      .createQueryBuilder('pokemon')
      .leftJoinAndSelect('pokemon.types', 'type')
      .leftJoinAndSelect('pokemon.trainer', 'trainer');

    if (query.search) {
      qb.andWhere('LOWER(pokemon.name) LIKE :search', {
        search: `%${query.search.toLowerCase()}%`,
      });
    }

    if (query.typeId) {
      qb.andWhere((subQuery) => {
        const subquery = subQuery
          .subQuery()
          .select('link.pokemon_id')
          .from('pokemon_type_links', 'link')
          .where('link.type_id = :typeId')
          .getQuery();
        return `pokemon.id IN ${subquery}`;
      }).setParameter('typeId', query.typeId);
    }

    if (query.trainerId) {
      qb.andWhere('trainer.id = :trainerId', { trainerId: query.trainerId });
    }

    const [items, total] = await qb
      .orderBy('pokemon.id', 'ASC')
      .take(query.limit)
      .skip(query.offset)
      .getManyAndCount();

    return {
      items: items.map((pokemon) => this.toDto(pokemon)),
      total,
      limit: query.limit,
      offset: query.offset,
    };
  }

  async findOne(id: number): Promise<PokemonDto> {
    return this.toDto(await this.getEntity(id));
  }

  async create(dto: CreatePokemonDto): Promise<PokemonDto> {
    const name = dto.name.toLowerCase();
    await this.assertNameAvailable(name);

    const pokemon = this.pokemons.create({
      name,
      height: dto.height,
      weight: dto.weight,
      imageUrl: dto.imageUrl,
      types: await this.pokemonTypesService.findByIds(dto.typeIds),
      trainer: await this.resolveTrainer(dto.trainerId),
    });

    return this.toDto(await this.pokemons.save(pokemon));
  }

  async update(id: number, dto: UpdatePokemonDto): Promise<PokemonDto> {
    const pokemon = await this.getEntity(id);

    if (dto.name && dto.name.toLowerCase() !== pokemon.name) {
      await this.assertNameAvailable(dto.name.toLowerCase());
      pokemon.name = dto.name.toLowerCase();
    }

    if (dto.height !== undefined) {
      pokemon.height = dto.height;
    }

    if (dto.weight !== undefined) {
      pokemon.weight = dto.weight;
    }

    if (dto.imageUrl !== undefined) {
      pokemon.imageUrl = dto.imageUrl;
    }

    if (dto.typeIds) {
      pokemon.types = await this.pokemonTypesService.findByIds(dto.typeIds);
    }

    if (dto.trainerId !== undefined) {
      pokemon.trainer = await this.resolveTrainer(dto.trainerId);
    }

    return this.toDto(await this.pokemons.save(pokemon));
  }

  async remove(id: number): Promise<void> {
    const pokemon = await this.getEntity(id);
    await this.pokemons.remove(pokemon);
  }

  async getEntity(id: number): Promise<Pokemon> {
    const pokemon = await this.pokemons.findOne({
      where: { id },
      relations: { types: true, trainer: true },
    });

    if (!pokemon) {
      throw new NotFoundException(`Pokemon ${id} was not found`);
    }

    return pokemon;
  }

  toDto(pokemon: Pokemon): PokemonDto {
    return {
      id: pokemon.id,
      name: pokemon.name,
      height: pokemon.height,
      weight: pokemon.weight,
      imageUrl: pokemon.imageUrl,
      types: (pokemon.types ?? []).map((type) =>
        this.pokemonTypesService.toDto(type),
      ),
      trainer: pokemon.trainer
        ? {
            id: pokemon.trainer.id,
            name: pokemon.trainer.name,
            hometown: pokemon.trainer.hometown,
          }
        : null,
    };
  }

  private async assertNameAvailable(name: string): Promise<void> {
    const existing = await this.pokemons.findOneBy({ name });
    if (existing) {
      throw new ConflictException(`Pokemon "${name}" already exists`);
    }
  }

  private async resolveTrainer(
    trainerId: number | null | undefined,
  ): Promise<Trainer | null> {
    if (trainerId === undefined || trainerId === null) {
      return null;
    }

    const trainer = await this.trainers.findOneBy({ id: trainerId });
    if (!trainer) {
      throw new BadRequestException(`Trainer ${trainerId} does not exist`);
    }

    return trainer;
  }
}
