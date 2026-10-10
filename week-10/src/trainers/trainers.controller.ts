import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { IdParamDto } from '../common/dto/id-param.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { PokemonDto } from '../pokemons/dto/pokemon.dto.js';
import {
  CreateTrainerDto,
  ReplaceTrainerDto,
  TrainerDto,
  TrainerListDto,
} from './dto/trainer.dto.js';
import { TrainersService } from './trainers.service.js';

@ApiTags('trainers')
@Controller('trainers')
export class TrainersController {
  constructor(private readonly trainersService: TrainersService) {}

  @Get()
  @ZodResponse({
    status: 200,
    description: 'List trainers and their pokemon',
    type: TrainerListDto,
  })
  findAll(@Query() query: PaginationQueryDto) {
    return this.trainersService.findAll(query);
  }

  @Get(':id')
  @ZodResponse({
    status: 200,
    description: 'Get a trainer by id',
    type: TrainerDto,
  })
  findOne(@Param() params: IdParamDto) {
    return this.trainersService.findOne(params.id);
  }

  @Get(':id/pokemons')
  @ZodResponse({
    status: 200,
    description: 'List pokemon currently assigned to a trainer',
    type: [PokemonDto],
  })
  findPokemons(@Param() params: IdParamDto) {
    return this.trainersService.findPokemons(params.id);
  }

  @Post()
  @ZodResponse({
    status: 201,
    description: 'Create a trainer',
    type: TrainerDto,
  })
  create(@Body() dto: CreateTrainerDto) {
    return this.trainersService.create(dto);
  }

  @Put(':id')
  @ZodResponse({
    status: 200,
    description: 'Replace a trainer (full update)',
    type: TrainerDto,
  })
  replace(@Param() params: IdParamDto, @Body() dto: ReplaceTrainerDto) {
    return this.trainersService.replace(params.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({
    description: 'Trainer deleted; assigned pokemon become wild',
  })
  remove(@Param() params: IdParamDto) {
    return this.trainersService.remove(params.id);
  }
}
