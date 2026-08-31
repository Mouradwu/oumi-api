import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wilaya } from './entities/wilaya.entity';
import { Daira } from './entities/daira.entity';
import { Commune } from './entities/commune.entity';
import { GeographyController } from './geography.controller';
import { GeographyService } from './geography.service';

@Module({
  imports: [TypeOrmModule.forFeature([Wilaya, Daira, Commune])],
  controllers: [GeographyController],
  providers: [GeographyService],
  exports: [GeographyService],
})
export class GeographyModule {}