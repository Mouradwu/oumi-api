import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { HealthFacilitiesService } from './health-facilities.service';

@Controller('health')
export class HealthFacilitiesController {
  constructor(private readonly service: HealthFacilitiesService) {}

  @Get('hospitals')
  getHospitals(@Query('wilaya_id') wilayaId: string) {
    const id = wilayaId ? parseInt(wilayaId, 10) : undefined;
    return this.service.findAllHospitals(id);
  }

  @Post('hospitals')
  addHospital(@Body() body: any) {
    return this.service.createHospital(body);
  }

  @Get('transfusion-centers')
  getCenters(@Query('wilaya_id') wilayaId: string) {
    const id = wilayaId ? parseInt(wilayaId, 10) : undefined;
    return this.service.findAllCenters(id);
  }

  @Post('transfusion-centers')
  addCenter(@Body() body: any) {
    return this.service.createCenter(body);
  }
}