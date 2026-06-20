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

export class CompleteMiningSessionDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiProperty({ minimum: 0, example: 3600 })
  totalSeconds: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiProperty({ minimum: 0, example: 1200 })
  secondsAbove80Percent: number;

  @IsOptional()
  @IsNumberString()
  @ApiPropertyOptional({
    description:
      'Deprecated. Coin rewards are calculated server-side from rawMinedValue.',
    example: '12.50000000',
    deprecated: true,
  })
  coinAmount?: string;

  @IsNumberString()
  @ApiProperty({
    description: 'Raw mined value before commissions (decimal as string).',
    example: '15.00000000',
  })
  rawMinedValue: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(90)
  @ApiPropertyOptional({ minimum: 0, maximum: 90, example: 55.25 })
  avgPowerPercent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(90)
  @ApiPropertyOptional({ minimum: 0, maximum: 90, example: 80.5 })
  peakPowerPercent?: number;

  @IsOptional()
  @IsNumberString()
  @ApiPropertyOptional({
    description: 'Optional session hashrate (decimal as string).',
    example: '123.456',
  })
  hashrate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiPropertyOptional({ minimum: 0, example: 42 })
  sharesAccepted?: number;
}
