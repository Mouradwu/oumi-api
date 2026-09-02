import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request, Patch } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() dto: CreateRequestDto) {
    return this.requestsService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Query('userId') userId?: string) {
    return this.requestsService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.requestsService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.requestsService.updateStatus(id, status);
  }

  // Le donneur declare avoir effectue le don (etape intermediaire,
  // n'incremente PAS encore l'impact).
  @Post(':id/mark-donated')
  @UseGuards(JwtAuthGuard)
  markDonated(@Param('id') id: string, @Request() req) {
    return this.requestsService.markDonated(id, req.user.id);
  }

  // Le demandeur d'origine confirme : SEUL evenement qui incremente
  // reellement l'impact/les badges du donneur (protege cote serveur
  // contre le double comptage).
  @Post(':id/confirm-donation')
  @UseGuards(JwtAuthGuard)
  confirmDonation(@Param('id') id: string, @Request() req) {
    return this.requestsService.confirmDonation(id, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req) {
    return this.requestsService.remove(id, req.user.id);
  }
}