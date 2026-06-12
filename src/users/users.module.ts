import { Module } from '@nestjs/common';
import { LevelService } from '../common/services/level.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, LevelService],
  exports: [UsersService],
})
export class UsersModule {}
