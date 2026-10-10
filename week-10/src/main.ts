import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle('PokeAPI')
    .setDescription(
      'Small PokeAPI-style REST service for pokemons, elemental types, and trainers. Request bodies, query strings, and path params are validated with Zod.',
    )
    .setVersion('1.0.0')
    .addTag('health', 'Service metadata')
    .addTag('pokemons', 'Pokemon creatures')
    .addTag('types', 'Elemental types such as Fire or Water')
    .addTag('trainers', 'Trainers and the pokemon assigned to them')
    .build();

  const document = cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs-json',
    yamlDocumentUrl: 'docs-yaml',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`PokeAPI running at http://localhost:${port}`);
  console.log(`OpenAPI docs at http://localhost:${port}/docs`);
}

await bootstrap();
