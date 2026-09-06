import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { Donor } from '../donors/entities/donor.entity';
import { DonationRequest } from '../requests/donation-request.entity';
import { CompatibilityModule } from '../compatibility/compatibility.module';

@Module({
  imports: [TypeOrmModule.forFeature([Donor, DonationRequest]), CompatibilityModule],
  controllers: [MatchingController],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
