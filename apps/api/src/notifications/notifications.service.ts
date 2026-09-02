import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { User } from '../users/user.entity';
import { DonationRequest } from '../requests/donation-request.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private readonly notifRepo: Repository<Notification>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(DonationRequest) private readonly requestRepo: Repository<DonationRequest>,
  ) {}

  async create(
    userId: string,
    dto: { title: string; body: string; type: string; data?: any },
    senderId?: string,
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return { success: false, error: 'Destinataire introuvable' };

    const data = dto.data ?? {};
    const requestId = data.requestId ?? data.request_id;
    if (requestId) {
      const req = await this.requestRepo.findOne({ where: { id: requestId } });
      if (req) {
        // IMPORTANT (confidentialite) : ne jamais inclure le telephone/email
        // du demandeur ici. Ces coordonnees ne doivent apparaitre que dans
        // la reponse de accept(), apres consentement explicite du donneur.
        data.request = {
          id: req.id,
          blood_type: req.blood_type,
          donation_type: req.donation_type,
          urgency_level: req.urgency_level,
          hospital_name: req.hospital_name,
          needed_date: req.needed_date,
          requester: {
            id: req.requester?.id,
            name: ((req.requester?.first_name ?? '') + ' ' + (req.requester?.last_name ?? '')).trim(),
          },
        };
      }
    }

    // Regle metier : un meme expediteur ne peut avoir qu'une seule demande
    // ACTIVE (non encore acceptee) envers une meme personne, imposee au
    // niveau base via un index unique partiel (voir migrate.ts). On
    // convertit la violation de contrainte en erreur claire plutot que de
    // laisser remonter une erreur SQL brute.
    try {
      const n = this.notifRepo.create({
        user,
        senderId: senderId ?? null,
        title: dto.title,
        body: dto.body,
        type: dto.type,
        data,
      });
      const saved = await this.notifRepo.save(n);
      return { success: true, notification: this.serialize(saved) };
    } catch (error: any) {
      if (error.code === '23505') {
        // violation_unique_violation (Postgres)
        throw new ConflictException('Vous avez déjà une demande active envers cette personne.');
      }
      throw error;
    }
  }

  async getMyNotifications(userId: string) {
    const list = await this.notifRepo.find({ where: { user: { id: userId } }, order: { created_at: 'DESC' } });
    return list.map((n) => this.serialize(n));
  }

  async markAsRead(id: string) {
    const n = await this.notifRepo.findOne({ where: { id } });
    if (!n) throw new NotFoundException();
    n.is_read = true;
    return this.serialize(await this.notifRepo.save(n));
  }

  async deleteOne(id: string, userId: string) {
    const n = await this.notifRepo.findOne({ where: { id }, relations: ['user'] });
    if (!n || n.user?.id !== userId) throw new NotFoundException();
    await this.notifRepo.delete(id);
    return { success: true };
  }

  async deleteAll(userId: string) {
    const result = await this.notifRepo
      .createQueryBuilder()
      .delete()
      .where('user_id = :userId', { userId })
      .execute();
    return { success: true, deleted: result.affected ?? 0 };
  }

  async accept(id: string, userId: string, consent: boolean) {
    if (!consent) {
      throw new BadRequestException(
        "Le consentement explicite est requis pour accepter cette demande et partager vos coordonnées.",
      );
    }

    const n = await this.notifRepo.findOne({ where: { id } });
    if (!n) throw new NotFoundException();

    const data = n.data ?? {};
    data.accepted = true;
    data.accepted_at = new Date().toISOString();
    data.accepted_by = userId;
    n.is_read = true;
    n.data = data;
    await this.notifRepo.save(n);

    const donorUser = await this.userRepo.findOne({ where: { id: userId } });
    const requestId = data.requestId ?? data.request_id ?? data.request?.id;

    let contact = data.contact ?? null;
    let requestInfo = data.request ?? null;

    if (requestId) {
      const req = await this.requestRepo.findOne({ where: { id: requestId } });
      if (req) {
        requestInfo = {
          id: req.id, blood_type: req.blood_type, donation_type: req.donation_type,
          urgency_level: req.urgency_level, hospital_name: req.hospital_name,
          service: req.service, needed_date: req.needed_date, contact_phone: req.contact_phone,
        };
        // Les coordonnees ne sont devoilees qu'ici, apres consentement.
        contact = {
          name: ((req.requester?.first_name ?? '') + ' ' + (req.requester?.last_name ?? '')).trim(),
          phone: req.requester?.phone ?? req.contact_phone,
          email: req.requester?.email,
        };
        await this.requestRepo.update(requestId, { status: 'matched' });

        if (req.requester?.id) {
          await this.create(
            req.requester.id,
            {
              title: 'Aide acceptée',
              body: (donorUser ? ((donorUser.first_name ?? '') + ' ' + (donorUser.last_name ?? '')).trim() : 'Un donneur') + ' a accepté votre demande.',
              type: 'accept',
              data: {
                requestId,
                contact: {
                  name: donorUser ? ((donorUser.first_name ?? '') + ' ' + (donorUser.last_name ?? '')).trim() : '',
                  phone: donorUser?.phone,
                  email: donorUser?.email,
                },
              },
            },
            userId,
          );
        }
      }
    } else {
      // Pas de demande formelle associee (ex: contact direct depuis la
      // page Explorer, "Demander de l'aide" sur un profil donneur).
      const originalRequesterId = data.receiverId ?? data.userId ?? null;
      if (originalRequesterId) {
        const originalRequester = await this.userRepo.findOne({ where: { id: originalRequesterId } });
        if (originalRequester) {
          contact = {
            name: ((originalRequester.first_name ?? '') + ' ' + (originalRequester.last_name ?? '')).trim(),
            phone: originalRequester.phone,
            email: originalRequester.email,
          };
          await this.create(
            originalRequesterId,
            {
              title: 'Aide acceptée',
              body: (donorUser ? ((donorUser.first_name ?? '') + ' ' + (donorUser.last_name ?? '')).trim() : 'Quelqu\'un') + ' a accepté de vous aider.',
              type: 'accept',
              data: {
                contact: {
                  name: donorUser ? ((donorUser.first_name ?? '') + ' ' + (donorUser.last_name ?? '')).trim() : '',
                  phone: donorUser?.phone,
                  email: donorUser?.email,
                },
              },
            },
            userId,
          );
        }
      }
    }

    return { success: true, notification: this.serialize(n), contact, request: requestInfo };
  }

  private serialize(n: Notification) {
    return {
      id: n.id, title: n.title, body: n.body, message: n.body,
      type: n.type, is_read: n.is_read, created_at: n.created_at, data: n.data,
    };
  }
}
