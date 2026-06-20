import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { LevelService } from '../common/services/level.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  private readonly saltRounds = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly levelService: LevelService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: { select: { referrals: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const referralEarnings = await this.prisma.referralEarning.aggregate({
      where: { referrerUserId: userId },
      _sum: { amountEarned: true },
    });

    const referralPercent = await this.levelService.getReferralPercent(
      user.level,
    );
    const xpToNextLevel = await this.levelService.getXpToNextLevel(
      user.level,
      user.xp,
    );

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      referralCode: user.referralCode,
      xp: user.xp,
      level: user.level,
      coinBalance: user.coinBalance.toString(),
      miningPowerPercent: user.miningPowerPercent,
      referralPercent,
      xpToNextLevel,
      referralsCount: user._count.referrals,
      totalReferralEarnings:
        referralEarnings._sum.amountEarned?.toString() ?? '0',
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.displayName === undefined) {
      throw new BadRequestException('No profile fields to update');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { displayName: dto.displayName.trim() },
    });

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordMatches = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, this.saltRounds);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { success: true };
  }
}
