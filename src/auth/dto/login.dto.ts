import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @IsEmail()
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @ApiProperty({ minLength: 8, maxLength: 72, example: 'strong-password' })
  password: string;
}
