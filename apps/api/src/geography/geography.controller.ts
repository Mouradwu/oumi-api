import { Controller, Get, Param } from '@nestjs/common';
import { GeographyService } from './geography.service';

@Controller('wilayas')
export class GeographyController {
  constructor(private readonly service: GeographyService) {}

  @Get()
  findAll() {
    return this.service.getWilayas();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.getWilayaById(id);
  }
}