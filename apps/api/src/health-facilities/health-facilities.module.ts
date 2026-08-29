import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hospital } from '../hospitals/hospital.entity';
import { TransfusionCenter } from './transfusion-center.entity';
import { HealthFacilitiesService } from './health-facilities.service';
import { HealthFacilitiesController } from './health-facilities.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Hospital, TransfusionCenter])],
  providers: [HealthFacilitiesService],
  controllers: [HealthFacilitiesController],
})
export class HealthFacilitiesModule {}