import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() body: { title: string; body: string; type: string; data?: any }) {
    return this.service.create(req.user.id, body.title, body.body, body.type, body.data);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getMyNotifications(@Request() req) {
    return this.service.getMyNotifications(req.user.id);
  }

  @Post(':id/read')
  @UseGuards(JwtAuthGuard)
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.service.markAsRead(id, req.user.id);
  }
}