import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateRewardRequestDto {
  @IsUUID()
  @ApiProperty({
    description: 'Catalog item to redeem.',
    example: 'a0d79db2-92dd-42af-aeb6-320ce4d9c3d4',
  })
  catalogItemId: string;
}
