import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware.js';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware.js';
import { createTypeOrmOptions } from './database/database.config.js';
import { SeedModule } from './database/seed.module.js';
import { PokemonTypesController } from './pokemon-types/pokemon-types.controller.js';
import { PokemonTypesModule } from './pokemon-types/pokemon-types.module.js';
import { PokemonsController } from './pokemons/pokemons.controller.js';
import { PokemonsModule } from './pokemons/pokemons.module.js';
import { TrainersController } from './trainers/trainers.controller.js';
import { TrainersModule } from './trainers/trainers.module.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => createTypeOrmOptions(),
    }),
    PokemonTypesModule,
    PokemonsModule,
    TrainersModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestIdMiddleware, RequestLoggerMiddleware)
      .forRoutes(
        AppController,
        PokemonTypesController,
        PokemonsController,
        TrainersController,
      );
  }
}
