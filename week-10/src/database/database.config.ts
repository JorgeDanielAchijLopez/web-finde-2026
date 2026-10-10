import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import Database from 'better-sqlite3';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function getDatabasePath(): string {
  return (
    process.env.DATABASE_PATH ?? join(process.cwd(), 'data', 'pokeapi.sqlite')
  );
}

export function createTypeOrmOptions(): TypeOrmModuleOptions {
  const database = getDatabasePath();

  if (database !== ':memory:') {
    mkdirSync(dirname(database), { recursive: true });
  }

  return {
    type: 'better-sqlite3',
    database,
    driver: Database,
    autoLoadEntities: true,
    synchronize: true,
    logging: false,
  };
}
