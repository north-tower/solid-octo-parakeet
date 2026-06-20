import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @ApiPropertyOptional({
    description: 'Display name shown in the app.',
    example: 'CryptoGamer42',
  })
  displayName?: string;
}
