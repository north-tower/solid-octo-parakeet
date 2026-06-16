import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMiningPowerDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(90)
  @ApiProperty({ minimum: 0, maximum: 90, example: 65 })
  miningPowerPercent: number;
}
