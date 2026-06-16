import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class StartMiningSessionDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(90)
  @ApiPropertyOptional({ minimum: 0, maximum: 90, example: 50 })
  miningPowerPercent?: number;
}
