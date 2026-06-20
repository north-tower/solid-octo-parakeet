import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class FulfillmentApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const configuredKey = this.configService.get<string>('FULFILLMENT_API_KEY');

    if (!configuredKey) {
      throw new UnauthorizedException('Fulfillment API key is not configured');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const providedKey = request.header('x-api-key');

    if (!providedKey || providedKey !== configuredKey) {
      throw new UnauthorizedException('Invalid fulfillment API key');
    }

    return true;
  }
}
