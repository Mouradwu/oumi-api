import { Controller, Get, Post, Patch, Body, Param, Request, UseGuards, Logger, BadRequestException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly service: NotificationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() body: any, @Request() req) {
    // Log complet du body reçu
    this.logger.log('Body reçu : ' + JSON.stringify(body));

    // Extraire les champs manuellement (pour éviter les problèmes de DTO)
    const userId = body.userId || body.user_id || body.userID;
    const title = body.title || 'Notification';
    const message = body.message || 'Message sans contenu';
    const type = body.type || 'general';
    const data = body.data || null;

    if (!userId) {
      this.logger.error('userId manquant dans le body');
      throw new BadRequestException('Le champ "userId" (destinataire) est obligatoire.');
    }

    // Construire le DTO manuellement
    const dto = { userId, title, message, type, data };
    this.logger.log('DTO construit : ' + JSON.stringify(dto));

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
