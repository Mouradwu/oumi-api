import { Controller, Get, Post, Patch, Body, Param, Request, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateNotificationDto, @Request() req) {
    // Si userId n'est pas fourni, on prend l'utilisateur connecté
    if (!dto.userId) dto.userId = req.user.id;
    return this.service.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMyNotifications(@Request() req) {
    return this.service.findForUser(req.user.id);
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(@Param('id') id: string, @Request() req) {
    // On vérifie que la notification appartient à l'utilisateur
    return this.service.markAsRead(+id, req.user.id);
  }

  @Post(':id/accept')
  @UseGuards(JwtAuthGuard)
  async accept(@Param('id') id: string, @Request() req) {
    return this.service.accept(+id, req.user.id);
  }
}
