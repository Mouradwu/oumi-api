import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonorsController } from './donors.controller';
import { DonorsService } from './donors.service';
import { Donor } from './entities/donor.entity';
import { CompatibilityModule } from '../compatibility/compatibility.module';

@Module({
  imports: [TypeOrmModule.forFeature([Donor]), CompatibilityModule],
  controllers: [DonorsController],
  providers: [DonorsService],
  exports: [DonorsService],
})
export class DonorsModule {}