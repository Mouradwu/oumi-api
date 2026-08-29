import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly service: CampaignsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() body: any) {
    return this.service.create(req.user.id, body);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('upcoming')
  findUpcoming(@Query('wilaya_id') wilayaId: string) {
    const id = wilayaId ? parseInt(wilayaId, 10) : undefined;
    return this.service.findUpcoming(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}