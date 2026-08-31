import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { User } from '../users/user.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notifRepo: Repository<Notification>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    // Vérifier doublon pour les demandes
    if (dto.type === 'request' && dto.data?.receiverId) {
      const exists = await this.checkExistingRequest(dto.userId, dto.data.receiverId);
      if (exists) {
        throw new Error('Une demande est déjà en attente auprès de ce donneur.');
      }
    }
    const notif = this.notifRepo.create({
      userId: dto.userId,
      title: dto.title,
      message: dto.message,
      type: dto.type || null,
      data: dto.data || null,
      read: false,
    });
    return this.notifRepo.save(notif);
  }

  async findForUser(userId: string): Promise<Notification[]> {
    return this.notifRepo.find({
      where: { userId },
      order: { created_at: 'DESC' },
    });
  }

  async markAsRead(id: number, userId: string): Promise<Notification> {
    const notif = await this.notifRepo.findOne({ where: { id } });
    if (!notif) throw new NotFoundException('Notification non trouvée');
    if (notif.userId !== userId) throw new ForbiddenException('Non autorisé');
    notif.read = true;
    return this.notifRepo.save(notif);
  }

  async accept(id: number, userId: string): Promise<Notification> {
    const notif = await this.notifRepo.findOne({ where: { id }, relations: ['user'] });
    if (!notif) throw new NotFoundException('Notification non trouvée');
    if (notif.userId !== userId) throw new ForbiddenException('Non autorisé');
    notif.read = true;
    await this.notifRepo.save(notif);

    const donor = notif.user;
    const receiverId = notif.data?.receiverId;
    if (!receiverId) throw new Error('Receveur non trouvé');

    const donorWithPhone = await this.userRepo.findOne({ where: { id: donor.id } });
    const phone = donorWithPhone?.phone || 'non renseigné';

    const receiverNotif = this.notifRepo.create({
      userId: receiverId,
      title: '✅ Demande acceptée !',
      message: `${donor.first_name} ${donor.last_name} a accepté votre demande. Contactez-le au ${phone}.`,
      type: 'acceptance',
      data: { donorId: donor.id, donorPhone: phone },
      read: false,
    });
    await this.notifRepo.save(receiverNotif);
    return notif;
  }

  private async checkExistingRequest(userId: string, receiverId: string): Promise<boolean> {
    const existing = await this.notifRepo.findOne({
      where: {
        userId: userId,
        type: 'request',
        data: { receiverId: receiverId },
        read: false,
      },
    });
    return !!existing;
  }
}
