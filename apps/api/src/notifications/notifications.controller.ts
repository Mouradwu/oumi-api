import { Controller, Get, Post, Patch, Body, Param, Request, UseGuards, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly service: NotificationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateNotificationDto, @Request() req) {
    // Log du body reçu
    this.logger.log('Body reçu:', JSON.stringify(dto));
    if (!dto.userId) dto.userId = req.user.id;
    return await this.service.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMyNotifications(@Request() req) {
    return this.service.findForUser(req.user.id);
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(@Param('id') id: string, @Request() req) {
    return this.service.markAsRead(+id, req.user.id);
  }

  @Post(':id/accept')
  @UseGuards(JwtAuthGuard)
  async accept(@Param('id') id: string, @Request() req) {
    return this.service.accept(+id, req.user.id);
  }
}
