import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { DonationRequest } from './donation-request.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DonationRequest, User])],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}