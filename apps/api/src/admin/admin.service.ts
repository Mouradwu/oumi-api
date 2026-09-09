import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { Donor } from '../donors/entities/donor.entity';
import { DonationRequest } from '../requests/donation-request.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Donor) private donorRepo: Repository<Donor>,
    @InjectRepository(DonationRequest) private requestRepo: Repository<DonationRequest>,
    private dataSource: DataSource,
  ) {}

  // Vue d'ensemble pour le tableau de bord admin - uniquement des
  // comptages reels calcules a la volee, jamais de chiffres inventes.
  async getStats() {
    const [users, donors, requests, activeRequests, campaigns, facilities] = await Promise.all([
      this.userRepo.count(),
      this.donorRepo.count(),
      this.requestRepo.count(),
      this.requestRepo.count({ where: [{ status: 'pending' }, { status: 'accepted' }, { status: 'donation_declared' }] }),
      this.dataSource.query(`SELECT COUNT(*)::int AS c FROM campaigns WHERE status = 'active'`),
      this.dataSource.query(`SELECT COUNT(*)::int AS c FROM osm_health_facilities`),
    ]);
    return {
      users_total: users,
      donors_total: donors,
      requests_total: requests,
      requests_active: activeRequests,
      campaigns_active: campaigns[0]?.c ?? 0,
      facilities_total: facilities[0]?.c ?? 0,
    };
  }

  // Liste complete des utilisateurs - l'admin voit le telephone/email
  // (necessaire a la moderation), mais jamais le mot de passe (deja
  // exclu via @Exclude() + ClassSerializerInterceptor).
  async listUsers(search?: string) {
    const query = this.userRepo.createQueryBuilder('u').orderBy('u.created_at', 'DESC').limit(500);
    if (search) {
      query.where('u.email ILIKE :s OR u.first_name ILIKE :s OR u.last_name ILIKE :s OR u.phone ILIKE :s', { s: `%${search}%` });
    }
    return query.getMany();
  }

  async setUserActive(userId: string, isActive: boolean) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    user.is_active = isActive;
    return this.userRepo.save(user);
  }

  async setUserVerified(userId: string, field: 'email_verified' | 'phone_verified', value: boolean) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    (user as any)[field] = value;
    return this.userRepo.save(user);
  }

  async setUserRoles(userId: string, roles: string[]) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    user.roles = roles;
    return this.userRepo.save(user);
  }

  async deleteUser(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    await this.dataSource.query('DELETE FROM notifications WHERE user_id = $1 OR sender_id = $1', [userId]);
    await this.dataSource.query('DELETE FROM donation_requests WHERE requester_id = $1', [userId]);
    await this.dataSource.query('DELETE FROM donors WHERE user_id = $1', [userId]);
    await this.userRepo.delete(userId);
    return { success: true };
  }

  // Vue admin des donneurs - contact NON masque (contrairement a
  // l'endpoint public /donors), necessaire pour la moderation.
  async listDonors() {
    return this.donorRepo.find({ relations: ['user'], order: { created_at: 'DESC' }, take: 500 });
  }

  // Vue admin des demandes - contact NON masque.
  async listRequests() {
    return this.requestRepo.find({ relations: ['requester'], order: { created_at: 'DESC' }, take: 500 });
  }

  async deleteRequest(id: string) {
    const req = await this.requestRepo.findOne({ where: { id } });
    if (!req) throw new NotFoundException('Demande introuvable');
    await this.requestRepo.delete(id);
    return { success: true };
  }
}
