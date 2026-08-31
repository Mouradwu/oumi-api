import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Donor } from '../donors/entities/donor.entity';
import { DonationRequest } from '../requests/donation-request.entity';
import { Wilaya } from '../geography/wilaya.entity';
import { MatchingService } from './matching.service';
import { MatchingController } from './matching.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Donor, DonationRequest, Wilaya])],
  providers: [MatchingService],
  controllers: [MatchingController],
})
export class MatchingModule {}