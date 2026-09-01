import { Controller, Get, Param, Query } from '@nestjs/common';
import { GeographyService } from './geography.service';

@Controller('wilayas')
export class GeographyController {
  constructor(private readonly service: GeographyService) {}

  @Get('dairas')
  getDairas(@Query('wilaya_code') wilayaCode?: string) {
    return this.service.getDairas(wilayaCode);
  }

  @Get('communes')
  getCommunes(@Query('daira_code') dairaCode?: string) {
    return this.service.getCommunes(dairaCode);
  }

  @Get()
  findAll() {
    return this.service.getWilayas();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.getWilayaById(id);
  }
}
