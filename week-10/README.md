# PokeAPI (NestJS)

Small REST API for **pokemons**, **elemental types**, and **trainers**.

It uses NestJS modules (controllers, services, DTOs), Zod request validation, SQLite via TypeORM, HTTP middleware, and OpenAPI/Swagger.

## Run

```bash
npm install
npm run start:dev
```

- API: http://localhost:3000
- Swagger UI: http://localhost:3000/docs
- OpenAPI JSON: http://localhost:3000/docs-json

SQLite is created at `data/pokeapi.sqlite` and seeded with Fire/Water/Grass/Electric, four pokemon, and two trainers.

## Resources and HTTP methods

| Resource | Methods |
| --- | --- |
| `/pokemons` | `GET` list, `GET :id`, `POST` create, `PATCH :id` partial update, `DELETE :id` |
| `/types` | `GET` list, `GET :id`, `POST` create, `PATCH :id` partial update, `DELETE :id` |
| `/trainers` | `GET` list, `GET :id`, `GET :id/pokemons`, `POST` create, `PUT :id` replace, `DELETE :id` |

List endpoints accept `search`, `limit`, and `offset`. Pokemon lists also accept `typeId` and `trainerId`.

```bash
curl http://localhost:3000/pokemons?search=pika
curl -X POST http://localhost:3000/types \
  -H 'Content-Type: application/json' \
  -d '{"name":"dragon","color":"#7038F8"}'
```

Invalid bodies, query params, or ids return **400** from the Zod validation pipe. Missing records return **404**. Duplicate names return **409**.

## Layout

- `src/common/middleware` — request id + HTTP access log
- `src/common/dto` — shared Zod DTOs for ids and pagination
- `src/pokemons`, `src/pokemon-types`, `src/trainers` — entity, DTOs, service, controller, module
- `src/database` — SQLite config and seed data
- `src/main.ts` — CORS, Swagger, OpenAPI cleanup for Zod schemas
