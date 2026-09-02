import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    return user;
  }

  async updateRoles(userId: string, roles: string[]): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    user.roles = roles;
    return this.usersRepository.save(user);
  }

  async setActive(userId: string, isActive: boolean): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    user.is_active = isActive;
    return this.usersRepository.save(user);
  }

  // Suppression manuelle des enregistrements lies plutot que de compter
  // sur des contraintes ON DELETE CASCADE en base (certaines colonnes
  // ajoutees a posteriori via la migration de reconciliation n'ont pas
  // forcement cette contrainte - voir apps/api/src/migrate.ts).
  async deleteAccount(userId: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    await this.dataSource.query('DELETE FROM notifications WHERE user_id = $1 OR sender_id = $1', [userId]);
    await this.dataSource.query('DELETE FROM donation_requests WHERE requester_id = $1', [userId]);
    await this.dataSource.query('DELETE FROM donors WHERE user_id = $1', [userId]);
    await this.usersRepository.delete(userId);
  }
}
