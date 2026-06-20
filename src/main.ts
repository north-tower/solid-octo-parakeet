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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Gaming Rewards API')
    .setDescription(
      'API for authentication, user profiles, gamified mining sessions, and referral earnings. Phase 1 covers Auth and Users. Phase 2 covers Gamification. Phase 3 covers Referrals.',
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
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  await app.listen(port);
}
bootstrap();
