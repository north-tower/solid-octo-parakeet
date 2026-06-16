import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Phase 1 - Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a user account and returns authentication tokens for immediate use.',
  })
  @ApiBody({ type: RegisterDto })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login',
    description: 'Authenticates a user and returns authentication tokens.',
  })
  @ApiBody({ type: LoginDto })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
