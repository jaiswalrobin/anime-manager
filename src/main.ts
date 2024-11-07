import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

import { ValidationPipe } from '@nestjs/common';
import { TypeOrmExceptionFilter } from './exception-filters/exception.filters';
import { setupSwagger } from './config/swagger.config';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.use(cookieParser());
  setupSwagger(app);
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS || [];
  // console.log(allowedOrigins, 'allowedOrigins');
  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe()); // Enable validation globally
  app.useGlobalFilters(new TypeOrmExceptionFilter());
  await app.listen(process.env.APP_PORT);
}
bootstrap();
