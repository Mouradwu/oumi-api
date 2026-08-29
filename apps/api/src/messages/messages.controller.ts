import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('messages')
export class MessagesController {
  constructor(private readonly service: MessagesService) {}

  @Post('conversations')
  @UseGuards(JwtAuthGuard)
  createConversation(@Body() body: { participant_ids: string[]; request_id?: string }) {
    return this.service.createConversation(body.participant_ids, body.request_id);
  }

  @Post('conversations/:id/send')
  @UseGuards(JwtAuthGuard)
  sendMessage(@Param('id') conversationId: string, @Request() req, @Body() body: { content: string }) {
    return this.service.sendMessage(conversationId, req.user.id, body.content);
  }

  @Get('conversations/:id')
  @UseGuards(JwtAuthGuard)
  getMessages(@Param('id') conversationId: string) {
    return this.service.getConversationMessages(conversationId);
  }
}