import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Repository } from 'typeorm';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { Pokemon } from '../pokemons/pokemon.entity.js';
import {
  CreatePokemonTypeDto,
  PokemonTypeDto,
  PokemonTypeListDto,
  UpdatePokemonTypeDto,
} from './dto/pokemon-type.dto.js';
import { PokemonType } from './pokemon-type.entity.js';

@Injectable()
export class PokemonTypesService {
  constructor(
    @InjectRepository(PokemonType)
    private readonly types: Repository<PokemonType>,
    @InjectRepository(Pokemon)
    private readonly pokemons: Repository<Pokemon>,
  ) {}

  async findAll(query: PaginationQueryDto): Promise<PokemonTypeListDto> {
    const where = query.search
      ? { name: Like(`%${query.search.toLowerCase()}%`) }
      : {};

    const [items, total] = await this.types.findAndCount({
      where,
      order: { id: 'ASC' },
      take: query.limit,
      skip: query.offset,
    });

    return {
      items: items.map((type) => this.toDto(type)),
      total,
      limit: query.limit,
      offset: query.offset,
    };
  }

  async findOne(id: number): Promise<PokemonTypeDto> {
    return this.toDto(await this.getEntity(id));
  }

  async create(dto: CreatePokemonTypeDto): Promise<PokemonTypeDto> {
    const name = dto.name.toLowerCase();
    await this.assertNameAvailable(name);

    const created = await this.types.save(
      this.types.create({
        name,
        color: dto.color.toUpperCase(),
      }),
    );

    return this.toDto(created);
  }

  async update(id: number, dto: UpdatePokemonTypeDto): Promise<PokemonTypeDto> {
    const type = await this.getEntity(id);

    if (dto.name && dto.name.toLowerCase() !== type.name) {
      await this.assertNameAvailable(dto.name.toLowerCase());
      type.name = dto.name.toLowerCase();
    }

    if (dto.color) {
      type.color = dto.color.toUpperCase();
    }

    return this.toDto(await this.types.save(type));
  }

  async remove(id: number): Promise<void> {
    const type = await this.getEntity(id);
    const assignedCount = await this.pokemons
      .createQueryBuilder('pokemon')
      .innerJoin('pokemon.types', 'type')
      .where('type.id = :id', { id })
      .getCount();

    if (assignedCount > 0) {
      throw new ConflictException(
        `Type "${type.name}" is assigned to ${assignedCount} pokemon`,
      );
    }

    await this.types.remove(type);
  }

  async getEntity(id: number): Promise<PokemonType> {
    const type = await this.types.findOneBy({ id });
    if (!type) {
      throw new NotFoundException(`Type ${id} was not found`);
    }
    return type;
  }

  toDto(type: PokemonType): PokemonTypeDto {
    return {
      id: type.id,
      name: type.name,
      color: type.color,
    };
  }

  private async assertNameAvailable(name: string): Promise<void> {
    const existing = await this.types.findOneBy({ name });
    if (existing) {
      throw new ConflictException(`Type "${name}" already exists`);
    }
  }

  async findByIds(ids: number[]): Promise<PokemonType[]> {
    const uniqueIds = [...new Set(ids)];
    const types = await this.types.findBy({ id: In(uniqueIds) });

    if (types.length !== uniqueIds.length) {
      throw new BadRequestException('One or more type IDs do not exist');
    }

    return types;
  }
}
