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
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import {
  CreatePokemonTypeDto,
  PokemonTypeDto,
  PokemonTypeListDto,
  UpdatePokemonTypeDto,
} from './dto/pokemon-type.dto.js';
import { PokemonTypesService } from './pokemon-types.service.js';

@ApiTags('types')
@Controller('types')
export class PokemonTypesController {
  constructor(private readonly pokemonTypesService: PokemonTypesService) {}

  @Get()
  @ZodResponse({
    status: 200,
    description: 'List elemental types',
    type: PokemonTypeListDto,
  })
  findAll(@Query() query: PaginationQueryDto) {
    return this.pokemonTypesService.findAll(query);
  }

  @Get(':id')
  @ZodResponse({
    status: 200,
    description: 'Get an elemental type by id',
    type: PokemonTypeDto,
  })
  findOne(@Param() params: IdParamDto) {
    return this.pokemonTypesService.findOne(params.id);
  }

  @Post()
  @ZodResponse({
    status: 201,
    description: 'Create an elemental type',
    type: PokemonTypeDto,
  })
  create(@Body() dto: CreatePokemonTypeDto) {
    return this.pokemonTypesService.create(dto);
  }

  @Patch(':id')
  @ZodResponse({
    status: 200,
    description: 'Partially update an elemental type',
    type: PokemonTypeDto,
  })
  update(@Param() params: IdParamDto, @Body() dto: UpdatePokemonTypeDto) {
    return this.pokemonTypesService.update(params.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Type deleted' })
  remove(@Param() params: IdParamDto) {
    return this.pokemonTypesService.remove(params.id);
  }
}
