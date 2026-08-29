import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wilaya } from './wilaya.entity';
import { WilayaService } from './wilaya.service';
import { WilayaController } from './wilaya.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Wilaya])],
  providers: [WilayaService],
  controllers: [WilayaController],
  exports: [WilayaService],
})
export class GeographyModule {}
