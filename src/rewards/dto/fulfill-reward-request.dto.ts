import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class FulfillRewardRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @ApiPropertyOptional({
    description: 'Optional fulfillment notes for internal tracking.',
    example: 'Steam code sent via email.',
  })
  fulfillmentNotes?: string;
}
