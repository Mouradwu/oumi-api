import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Post()
  async create(@Body() body: any) {
    let userId = typeof body?.userId === 'string' ? body.userId : null;
    if (!userId || !UUID_RE.test(userId)) {
      const alt = body?.data?.receiverId ?? body?.receiverId ?? body?.data?.userId;
      userId = typeof alt === 'string' && UUID_RE.test(alt) ? alt : null;
    }
    if (!userId) {
      return { success: false, error: 'Destinataire invalide (UUID requis)' };
    }
    return this.service.create(userId, {
      title: body?.title ?? 'Notification',
      body: body?.body ?? body?.message ?? '',
      type: body?.type ?? 'system',
      data: body?.data ?? null,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getMine(@Request() req) {
    return this.service.getMyNotifications(req.user.id);
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  markRead(@Param('id') id: string) {
    return this.service.markAsRead(id);
  }

  @Post(':id/accept')
  @UseGuards(JwtAuthGuard)
  accept(@Param('id') id: string, @Request() req) {
    return this.service.accept(id, req.user.id);
  }
}