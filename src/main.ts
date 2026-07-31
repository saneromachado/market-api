import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configuredFrontendUrls =
    process.env.FRONTEND_URL?.split(',')
      .map((url) => url.trim())
      .filter(Boolean) ?? [];
  const productionFrontendUrls =
    process.env.NODE_ENV === 'production'
      ? [
          'https://mercatto-market-web.sanerdark.chatgpt.site',
          'https://saneromachado.github.io',
        ]
      : [];
  const frontendUrls = [...new Set([...configuredFrontendUrls, ...productionFrontendUrls])];

  app.setGlobalPrefix('api');
  app.use(helmet());
  app.enableCors({
    origin: frontendUrls?.length ? frontendUrls : true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Market API')
    .setDescription('API de mercado criada para estudo de testes automatizados')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  await app.listen(Number(process.env.PORT ?? 3000), '0.0.0.0');
}

void bootstrap();
