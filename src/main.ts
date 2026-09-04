import dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as express from 'express';
import { setDefaultResultOrder } from 'dns';

dotenv.config({ path: '.env.txt' });

setDefaultResultOrder('ipv4first');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const allowedOrigins = [
    process.env.FRONTEND_URL ?? 'http://localhost:3001',
    'https://donation-ms-gamma.vercel.app',
    'https://goodiebag.name.ng',
    'https://www.goodiebag.name.ng',
  ].map((url) => url.replace(/\/$/, ''));

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.use(
    express.json({
      verify: (req: any, res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Donation Platform API')
    .setVersion('1.0')
    .addCookieAuth('better-auth.session_token')
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}


bootstrap();