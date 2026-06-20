import { RewardRequestStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class ListFulfillmentRequestsDto {
  @IsOptional()
  @IsEnum(RewardRequestStatus)
  @ApiPropertyOptional({
    enum: RewardRequestStatus,
    description: 'Filter requests by status. Defaults to PENDING.',
    example: RewardRequestStatus.PENDING,
  })
  status?: RewardRequestStatus;
}
