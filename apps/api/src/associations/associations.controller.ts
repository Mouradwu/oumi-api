import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AssociationsService } from './associations.service';
import { CreateAssociationDto } from './dto/create-association.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('associations')
export class AssociationsController {
  constructor(private readonly service: AssociationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() dto: CreateAssociationDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get()
  findAll(@Query('wilaya_id') wilayaId: string) {
    const id = wilayaId ? parseInt(wilayaId, 10) : undefined;
    return this.service.findAll(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: CreateAssociationDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard)
  verify(@Param('id') id: string, @Body('verified') verified: boolean) {
    return this.service.verify(id, verified);
  }
}