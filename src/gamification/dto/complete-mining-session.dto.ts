import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsNumberString,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class CompleteMiningSessionDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  totalSeconds: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  secondsAbove80Percent: number;

  @IsNumberString()
  coinAmount: string;

  @IsOptional()
  @IsNumberString()
  rawMinedValue?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(90)
  avgPowerPercent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(90)
  peakPowerPercent?: number;

  @IsOptional()
  @IsNumberString()
  hashrate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sharesAccepted?: number;
}
