import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @IsEmail()
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @ApiProperty({ minLength: 8, maxLength: 72, example: 'strong-password' })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @ApiPropertyOptional({ maxLength: 50, example: 'Alex' })
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  @ApiPropertyOptional({ maxLength: 8, example: 'AB12CD34' })
  referralCode?: string;
}
