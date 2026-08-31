import { Controller, Get, Param } from '@nestjs/common';
import { GeographyService } from './geography.service';

@Controller('geography')
export class GeographyController {
  constructor(private readonly service: GeographyService) {}

  @Get('wilayas')
  getWilayas() { return this.service.getWilayas(); }

  @Get('dairas/:wilayaCode')
  getDairas(@Param('wilayaCode') code: string) { return this.service.getDairas(code); }

  @Get('communes/:dairaCode')
  getCommunes(@Param('dairaCode') code: string) { return this.service.getCommunes(code); }
}