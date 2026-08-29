import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Conversation) private convRepo: Repository<Conversation>,
    @InjectRepository(Message) private msgRepo: Repository<Message>,
  ) {}

  async createConversation(participantIds: string[], requestId?: string) {
    const conv = this.convRepo.create({
      participant_ids: participantIds,
      request_id: requestId,
    });
    return this.convRepo.save(conv);
  }

  async sendMessage(conversationId: string, senderId: string, content: string) {
    const msg = this.msgRepo.create({
      conversation: { id: conversationId } as any,
      sender: { id: senderId } as any,
      content,
    });
    return this.msgRepo.save(msg);
  }

  async getConversationMessages(conversationId: string) {
    return this.msgRepo.find({
      where: { conversation: { id: conversationId } },
      order: { created_at: 'ASC' },
    });
  }
}