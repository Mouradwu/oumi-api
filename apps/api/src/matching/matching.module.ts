import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { Donor } from '../donors/entities/donor.entity';
import { DonationRequest } from '../requests/entities/request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Donor, DonationRequest])],
  controllers: [MatchingController],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}