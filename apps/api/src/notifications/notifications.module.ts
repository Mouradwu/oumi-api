import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification } from './notification.entity';
import { User } from '../users/user.entity';
import { DonationRequest } from '../requests/donation-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, User, DonationRequest])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}