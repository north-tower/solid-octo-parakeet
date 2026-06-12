import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { generateReferralCode } from '../common/utils/referral-code.util';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    let referredByUserId: string | undefined;

    if (dto.referralCode) {
      const referrer = await this.prisma.user.findUnique({
        where: { referralCode: dto.referralCode.toUpperCase() },
      });

      if (!referrer) {
        throw new ConflictException('Invalid referral code');
      }

      referredByUserId = referrer.id;
    }

    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);
    const referralCode = await this.createUniqueReferralCode();

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        displayName: dto.displayName,
        referralCode,
        referredByUserId,
      },
    });

    return this.buildAuthResponse(user.id);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse(user.id);
  }

  private async buildAuthResponse(userId: string) {
    const profile = await this.usersService.getProfile(userId);
    const accessToken = await this.jwtService.signAsync({
      sub: userId,
      email: profile.email,
    });

    return { accessToken, user: profile };
  }

  private async createUniqueReferralCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      const referralCode = generateReferralCode();
      const existing = await this.prisma.user.findUnique({
        where: { referralCode },
      });

      if (!existing) {
        return referralCode;
      }
    }

    throw new ConflictException('Could not generate referral code');
  }
}
