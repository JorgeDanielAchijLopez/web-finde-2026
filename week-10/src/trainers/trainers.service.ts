import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { Pokemon } from '../pokemons/pokemon.entity.js';
import { PokemonsService } from '../pokemons/pokemons.service.js';
import {
  CreateTrainerDto,
  ReplaceTrainerDto,
  TrainerDto,
  TrainerListDto,
} from './dto/trainer.dto.js';
import { Trainer } from './trainer.entity.js';

@Injectable()
export class TrainersService {
  constructor(
    @InjectRepository(Trainer)
    private readonly trainers: Repository<Trainer>,
    @InjectRepository(Pokemon)
    private readonly pokemons: Repository<Pokemon>,
    private readonly pokemonsService: PokemonsService,
  ) {}

  async findAll(query: PaginationQueryDto): Promise<TrainerListDto> {
    const where = query.search
      ? { name: Like(`%${query.search.toLowerCase()}%`) }
      : {};

    const [items, total] = await this.trainers.findAndCount({
      where,
      relations: { pokemons: { types: true, trainer: true } },
      order: { id: 'ASC' },
      take: query.limit,
      skip: query.offset,
    });

    return {
      items: items.map((trainer) => this.toDto(trainer)),
      total,
      limit: query.limit,
      offset: query.offset,
    };
  }

  async findOne(id: number): Promise<TrainerDto> {
    return this.toDto(await this.getEntity(id));
  }

  async findPokemons(id: number) {
    const trainer = await this.getEntity(id);
    return trainer.pokemons.map((pokemon) =>
      this.pokemonsService.toDto(pokemon),
    );
  }

  async create(dto: CreateTrainerDto): Promise<TrainerDto> {
    const name = dto.name.toLowerCase();
    await this.assertNameAvailable(name);

    const created = await this.trainers.save(
      this.trainers.create({
        name,
        hometown: dto.hometown,
        pokemons: [],
      }),
    );

    return this.toDto(created);
  }

  async replace(id: number, dto: ReplaceTrainerDto): Promise<TrainerDto> {
    const trainer = await this.getEntity(id);
    const name = dto.name.toLowerCase();

    if (name !== trainer.name) {
      await this.assertNameAvailable(name);
    }

    trainer.name = name;
    trainer.hometown = dto.hometown;
    await this.trainers.save(trainer);

    return this.toDto(await this.getEntity(id));
  }

  async remove(id: number): Promise<void> {
    const trainer = await this.getEntity(id);
    await this.pokemons.update({ trainer: { id } }, { trainer: null });
    await this.trainers.remove(trainer);
  }

  private async getEntity(id: number): Promise<Trainer> {
    const trainer = await this.trainers.findOne({
      where: { id },
      relations: { pokemons: { types: true, trainer: true } },
    });

    if (!trainer) {
      throw new NotFoundException(`Trainer ${id} was not found`);
    }

    return trainer;
  }

  private toDto(trainer: Trainer): TrainerDto {
    return {
      id: trainer.id,
      name: trainer.name,
      hometown: trainer.hometown,
      pokemons: (trainer.pokemons ?? []).map((pokemon) =>
        this.pokemonsService.toDto(pokemon),
      ),
    };
  }

  private async assertNameAvailable(name: string): Promise<void> {
    const existing = await this.trainers.findOneBy({ name });
    if (existing) {
      throw new ConflictException(`Trainer "${name}" already exists`);
    }
  }
}
