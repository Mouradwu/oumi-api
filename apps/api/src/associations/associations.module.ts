import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Association } from './association.entity';
import { AssociationsService } from './associations.service';
import { AssociationsController } from './associations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Association])],
  providers: [AssociationsService],
  controllers: [AssociationsController],
})
export class AssociationsModule {}