import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { FacilitiesService } from './facilities.service';

@Controller('facilities')
export class FacilitiesController {
  constructor(private readonly service: FacilitiesService) {}

  @Get('stats')
  countByCategory() {
    return this.service.countByCategory();
  }

  @Get('nearby')
  findNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius_km') radiusKm: string,
    @Query('category') category?: string,
  ) {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      throw new BadRequestException('lat et lng sont obligatoires et doivent être des nombres');
    }
    const radius = radiusKm ? parseFloat(radiusKm) : 15;
    return this.service.findNearby(latNum, lngNum, radius, category);
  }

  @Get()
  findAll(@Query('category') category?: string, @Query('wilaya_id') wilaya_id?: string) {
    return this.service.findAll({ category, wilaya_id });
  }
}
