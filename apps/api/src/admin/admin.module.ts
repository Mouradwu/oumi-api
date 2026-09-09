import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/user.entity';
import { Donor } from '../donors/entities/donor.entity';
import { DonationRequest } from '../requests/donation-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Donor, DonationRequest])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
