import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const corsOrigins = configService
    .get<string>(
      'CORS_ORIGINS',
      'http://localhost:5173,http://127.0.0.1:5173',
    )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Gaming Rewards API')
    .setDescription(
      'API for authentication, user profiles, gamified mining sessions, referral earnings, reward redemptions, and desktop mining telemetry. Phase 1 covers Auth and Users. Phase 2 covers Gamification. Phase 3 covers Referrals. Phase 4 covers Rewards. Phase 5 covers Mining Integration.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Phase 1 - Auth', 'Authentication and token issuance.')
    .addTag('Phase 1 - Users', 'User profile and account endpoints.')
    .addTag('Phase 2 - Gamification', 'Mining sessions, XP, and rewards flows.')
    .addTag(
      'Phase 3 - Referrals',
      'Referral dashboard, earnings summary, and per-user breakdown.',
    )
    .addTag(
      'Phase 4 - Rewards',
      'Reward catalog browsing and user redemption requests.',
    )
    .addTag(
      'Phase 4 - Rewards Fulfillment',
      'Manual fulfillment workflow for pending reward requests.',
    )
    .addTag(
      'Phase 5 - Mining Integration',
      'Desktop miner heartbeats, session abort, and trusted settlement.',
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  await app.listen(port);
}
bootstrap();
