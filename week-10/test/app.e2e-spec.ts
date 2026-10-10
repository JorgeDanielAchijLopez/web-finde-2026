import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

describe('PokeAPI (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.DATABASE_PATH = ':memory:';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('GET / returns health metadata', async () => {
    const response = await request(app.getHttpServer()).get('/').expect(200);
    expect(response.body.name).toBe('PokeAPI');
    expect(response.headers['x-request-id']).toBeDefined();
  });

  it('GET /pokemons returns seeded pokemon', async () => {
    const response = await request(app.getHttpServer())
      .get('/pokemons')
      .expect(200);

    expect(response.body.total).toBeGreaterThanOrEqual(4);
    expect(response.body.items[0]).toHaveProperty('types');
  });

  it('POST /pokemons rejects invalid payloads', async () => {
    await request(app.getHttpServer())
      .post('/pokemons')
      .send({ name: '', height: -1 })
      .expect(400);
  });

  it('POST /types then PATCH and DELETE a custom type', async () => {
    const created = await request(app.getHttpServer())
      .post('/types')
      .send({ name: 'dragon', color: '#7038F8' })
      .expect(201);

    expect(created.body.name).toBe('dragon');

    const updated = await request(app.getHttpServer())
      .patch(`/types/${created.body.id}`)
      .send({ color: '#A890F0' })
      .expect(200);

    expect(updated.body.color).toBe('#A890F0');

    await request(app.getHttpServer())
      .delete(`/types/${created.body.id}`)
      .expect(204);
  });

  it('PUT /trainers replaces the resource', async () => {
    const trainers = await request(app.getHttpServer())
      .get('/trainers')
      .expect(200);

    const ash = trainers.body.items.find(
      (trainer: { name: string }) => trainer.name === 'ash',
    );

    const replaced = await request(app.getHttpServer())
      .put(`/trainers/${ash.id}`)
      .send({ name: 'ash ketchum', hometown: 'Pallet Town' })
      .expect(200);

    expect(replaced.body.name).toBe('ash ketchum');
  });

  afterAll(async () => {
    await app.close();
  });
});
