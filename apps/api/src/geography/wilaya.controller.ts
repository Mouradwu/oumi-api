import { Controller, Get, Param } from '@nestjs/common';
import { WilayaService } from './wilaya.service';

@Controller('wilayas')
export class WilayaController {
  constructor(private readonly wilayaService: WilayaService) {}

  @Get()
  findAll() {
    return this.wilayaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wilayaService.findOne(+id);
  }
}