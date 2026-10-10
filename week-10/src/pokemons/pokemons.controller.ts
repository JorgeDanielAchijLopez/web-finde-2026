import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { IdParamDto } from '../common/dto/id-param.dto.js';
import {
  CreatePokemonDto,
  PokemonDto,
  PokemonListDto,
  PokemonListQueryDto,
  UpdatePokemonDto,
} from './dto/pokemon.dto.js';
import { PokemonsService } from './pokemons.service.js';

@ApiTags('pokemons')
@Controller('pokemons')
export class PokemonsController {
  constructor(private readonly pokemonsService: PokemonsService) {}

  @Get()
  @ZodResponse({
    status: 200,
    description: 'List pokemons, optionally filtered by name, type, or trainer',
    type: PokemonListDto,
  })
  findAll(@Query() query: PokemonListQueryDto) {
    return this.pokemonsService.findAll(query);
  }

  @Get(':id')
  @ZodResponse({
    status: 200,
    description: 'Get a pokemon by id',
    type: PokemonDto,
  })
  findOne(@Param() params: IdParamDto) {
    return this.pokemonsService.findOne(params.id);
  }

  @Post()
  @ZodResponse({
    status: 201,
    description: 'Create a pokemon',
    type: PokemonDto,
  })
  create(@Body() dto: CreatePokemonDto) {
    return this.pokemonsService.create(dto);
  }

  @Patch(':id')
  @ZodResponse({
    status: 200,
    description: 'Partially update a pokemon',
    type: PokemonDto,
  })
  update(@Param() params: IdParamDto, @Body() dto: UpdatePokemonDto) {
    return this.pokemonsService.update(params.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Pokemon deleted' })
  remove(@Param() params: IdParamDto) {
    return this.pokemonsService.remove(params.id);
  }
}
