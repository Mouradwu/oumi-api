import { Injectable } from '@nestjs/common';



import { User } from '../users/user.entity';


import { Notification } from './notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
  ) {}

  async create(userId: string, title: string, body: string, type: string, data?: any) {
    const notif = this.notifRepo.create({
      user: { id: userId } as any,
      title,
      body,
      type,
      data,
    });
    return this.notifRepo.save(notif);
  }

  async getMyNotifications(userId: string) {
    return this.notifRepo.find({
      where: { user: { id: userId } },
      order: { created_at: 'DESC' },
      take: 50,
    });
  }

  async markAsRead(notifId: string, userId: string) {
    await this.notifRepo.update({ id: notifId, user: { id: userId } }, { is_read: true });
    return { success: true };
  }
}



