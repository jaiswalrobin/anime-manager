import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication): void {
  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Anime Adventure API') // Replace with your title
    .setDescription('The API documentation for Anime Adventure backend') // API description
    .setVersion('1.0')
    .addTag('Anime') // Tagging for categories
    .addBearerAuth() // If using JWT or other authentication mechanisms
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document); // Swagger UI will be available at /api-docs
}
