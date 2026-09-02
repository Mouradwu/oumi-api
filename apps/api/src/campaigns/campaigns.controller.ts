import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly service: CampaignsService) {}

  // ---- Public ----

  @Get()
  findActive(@Query('wilaya_id') wilayaId?: string) {
    const id = wilayaId ? parseInt(wilayaId, 10) : undefined;
    return this.service.findActive(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // ---- Administration (role admin obligatoire, verifie cote serveur) ----

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAllForAdmin() {
    return this.service.findAllForAdmin();
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(@Request() req, @Body() body: any) {
    return this.service.create(req.user.id, body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, AdminGuard)
  publish(@Param('id') id: string) {
    return this.service.publish(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  setStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.service.setStatus(id, status);
  }
}
