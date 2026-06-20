import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsNumberString,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MiningSessionHeartbeatDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(90)
  @ApiProperty({ minimum: 0, maximum: 90, example: 65 })
  powerPercent: number;

  @IsOptional()
  @IsNumberString()
  @ApiPropertyOptional({
    description: 'Current miner hashrate (decimal as string).',
    example: '2500.00000000',
  })
  hashrate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiPropertyOptional({ minimum: 0, example: 4 })
  sharesAccepted?: number;
}
