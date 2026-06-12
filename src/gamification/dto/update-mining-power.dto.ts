import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class UpdateMiningPowerDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(90)
  miningPowerPercent: number;
}
