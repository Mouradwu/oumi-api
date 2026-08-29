import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Association } from './association.entity';
import { CreateAssociationDto } from './dto/create-association.dto';

@Injectable()
export class AssociationsService {
  constructor(
    @InjectRepository(Association) private assocRepo: Repository<Association>,
  ) {}

  async create(userId: string, dto: CreateAssociationDto) {
    const existing = await this.assocRepo.findOne({ where: { admin: { id: userId } } });
    if (existing) {
      throw new ConflictException('Vous avez deja une association enregistree');
    }

    const assoc = this.assocRepo.create({
      name: dto.name,
      name_ar: dto.name_ar || null,
      wilaya_id: dto.wilaya_id || null,
      address: dto.address || null,
      phone: dto.phone || null,
      email: dto.email || null,
      description: dto.description || null,
      admin: { id: userId } as any,
    });
    return this.assocRepo.save(assoc);
  }

  async findAll(wilayaId?: number) {
    const where = wilayaId ? { wilaya_id: wilayaId } : {};
    return this.assocRepo.find({ where, take: 100 });
  }

  async findOne(id: string) {
    const assoc = await this.assocRepo.findOne({ where: { id } });
    if (!assoc) throw new NotFoundException('Association non trouvee');
    return assoc;
  }

  async update(id: string, dto: Partial<CreateAssociationDto>) {
    await this.assocRepo.update(id, dto);
    return this.findOne(id);
  }

  async verify(id: string, verified: boolean) {
    await this.assocRepo.update(id, { is_verified: verified });
    return this.findOne(id);
  }
}