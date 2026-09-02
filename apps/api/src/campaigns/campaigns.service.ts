import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from './campaign.entity';

const VALID_STATUSES = ['draft', 'active', 'inactive'];

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign) private campaignRepo: Repository<Campaign>,
  ) {}

  // Le statut "ended" n'est jamais stocke : il est calcule au vol des que
  // la date de fin est depassee, meme si l'administrateur a oublie de
  // desactiver la campagne manuellement.
  private withComputedStatus(c: Campaign): Campaign {
    if (c.status === 'active' && c.end_date && new Date(c.end_date).getTime() < Date.now()) {
      (c as any).status = 'ended';
    }
    return c;
  }

  async create(userId: string, data: Partial<Campaign>) {
    const campaign = this.campaignRepo.create({
      ...data,
      start_date: data.start_date ? new Date(data.start_date) : new Date(),
      end_date: data.end_date ? new Date(data.end_date) : null,
      organizer: { id: userId } as any,
      status: 'draft',
    });
    return this.campaignRepo.save(campaign);
  }

  // Liste publique : uniquement les campagnes actives et pas encore
  // terminees (le calcul de "ended" est applique avant filtrage).
  async findActive(wilayaId?: number) {
    const query = this.campaignRepo
      .createQueryBuilder('c')
      .where("c.status = 'active'")
      .andWhere('(c.end_date IS NULL OR c.end_date > NOW())');
    if (wilayaId) {
      query.andWhere('c.wilaya_id = :wilayaId', { wilayaId });
    }
    query.orderBy('c.display_order', 'ASC').addOrderBy('c.start_date', 'ASC').take(100);
    return query.getMany();
  }

  async findOne(id: string) {
    const campaign = await this.campaignRepo.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException('Campagne non trouvée');
    return this.withComputedStatus(campaign);
  }

  // Vue administrateur : toutes les campagnes, tous statuts confondus.
  async findAllForAdmin() {
    const list = await this.campaignRepo.find({ order: { created_at: 'DESC' } });
    return list.map((c) => this.withComputedStatus(c));
  }

  async update(id: string, data: Partial<Campaign>) {
    const campaign = await this.campaignRepo.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException('Campagne non trouvée');
    const { status, ...rest } = data as any; // le statut ne se change que via les routes dediees
    await this.campaignRepo.update(id, {
      ...rest,
      start_date: rest.start_date ? new Date(rest.start_date) : campaign.start_date,
      end_date: rest.end_date !== undefined ? (rest.end_date ? new Date(rest.end_date) : null) : campaign.end_date,
    });
    return this.findOne(id);
  }

  async remove(id: string) {
    const campaign = await this.campaignRepo.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException('Campagne non trouvée');
    await this.campaignRepo.delete(id);
    return { success: true };
  }

  async publish(id: string) {
    const campaign = await this.campaignRepo.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException('Campagne non trouvée');
    if (campaign.status !== 'draft') {
      throw new BadRequestException('Seule une campagne en brouillon peut être publiée.');
    }
    campaign.status = 'active';
    campaign.published_at = new Date();
    return this.campaignRepo.save(campaign);
  }

  async setStatus(id: string, status: string) {
    if (!['active', 'inactive'].includes(status)) {
      throw new BadRequestException("Statut invalide (attendu: active ou inactive).");
    }
    const campaign = await this.campaignRepo.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException('Campagne non trouvée');
    if (campaign.status === 'draft') {
      throw new BadRequestException('Publiez la campagne avant de changer son statut.');
    }
    campaign.status = status;
    return this.campaignRepo.save(campaign);
  }
}
