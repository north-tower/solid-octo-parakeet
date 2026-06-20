import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectRewardRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @ApiPropertyOptional({
    description: 'Optional reason the redemption request was rejected.',
    example: 'Insufficient verification details.',
  })
  fulfillmentNotes?: string;
}
