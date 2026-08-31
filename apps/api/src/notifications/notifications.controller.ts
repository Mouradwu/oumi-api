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
    try {
      if (!dto.userId) dto.userId = req.user.id;
      return await this.service.create(dto);
    } catch (error) {
      this.logger.error('Erreur lors de l\'envoi de la demande', error.stack);
      // En développement, on renvoie l'erreur complète (sauf si c'est une erreur de validation)
      if (error instanceof BadRequestException) {
        throw error;
      }
      // On renvoie l'erreur avec son message et sa stack (utile pour debug)
      throw new InternalServerErrorException({
        message: error.message,
        stack: error.stack,
        statusCode: 500,
      });
    }
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
