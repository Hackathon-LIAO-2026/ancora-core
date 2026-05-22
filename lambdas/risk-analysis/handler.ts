import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import serverlessHttp from 'serverless-http';
import { AppModule } from './src/app.module';

let cachedHandler: any;

/**
 * Entrypoint para AWS Lambda via Serverless Framework.
 * Usa cache do NestJS app para reutilizar entre invocações (warm start).
 */
export const handler = async (event: any, context: any) => {
  if (!cachedHandler) {
    const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    app.enableCors();
    await app.init();

    const expressApp = app.getHttpAdapter().getInstance();
    cachedHandler = serverlessHttp(expressApp);
  }

  return cachedHandler(event, context);
};
