import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  @ApiProperty({ description: 'Current account password.' })
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @ApiProperty({ description: 'New password (minimum 8 characters).' })
  newPassword: string;
}
