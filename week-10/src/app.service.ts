import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      name: 'PokeAPI',
      version: '1.0.0',
      docs: '/docs',
      resources: ['/pokemons', '/types', '/trainers'],
    };
  }
}
