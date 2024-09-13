import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { ValidationPipe } from '@nestjs/common';
import { TypeOrmExceptionFilter } from './typeormException.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe()); // Enable validation globally
  app.useGlobalFilters(new TypeOrmExceptionFilter());
  await app.listen(3003);
}
bootstrap();
