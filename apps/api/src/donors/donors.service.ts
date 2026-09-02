import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donor } from './entities/donor.entity';
import { CreateDonorDto } from './dto/create-donor.dto';

@Injectable()
export class DonorsService {
  constructor(
    @InjectRepository(Donor)
    private donorRepository: Repository<Donor>,
  ) {}

  // Retire le telephone/email de l'utilisateur associe : ces coordonnees
  // ne doivent apparaitre dans l'API que via le flux d'acceptation
  // explicite (notifications.accept), jamais dans une liste/consultation
  // publique de donneurs.
  // Ne renvoie qu'une projection publique minimale de l'utilisateur (liste
  // blanche, pas liste noire) : une fois l'entite User transformee en
  // objet simple, les decorateurs @Exclude() de class-transformer ne
  // s'appliquent plus a la serialisation finale (ils ne fonctionnent que
  // sur de vraies instances de classe) - il ne faut donc JAMAIS construire
  // cet objet par simple exclusion de champs (le mot de passe repasserait
  // sinon), mais toujours en listant explicitement ce qui est autorise.
  private sanitize(donor: Donor): Donor {
    if (donor?.user) {
      const u = donor.user as any;
      donor.user = { id: u.id, first_name: u.first_name, last_name: u.last_name } as any;
    }
    return donor;
  }

  async create(createDonorDto: CreateDonorDto): Promise<Donor> {
    const donor = this.donorRepository.create(createDonorDto);
    return this.donorRepository.save(donor);
  }

  async findAll(filters: {
    blood_type?: string;
    donation_type?: string;
    wilaya_id?: string;
    availability_status?: string;
  }): Promise<Donor[]> {
    const query = this.donorRepository
      .createQueryBuilder('donor')
      .leftJoinAndSelect('donor.user', 'user')
      .where('1=1');

    if (filters.blood_type) {
      query.andWhere('donor.blood_type = :blood_type', { blood_type: filters.blood_type });
    }
    if (filters.donation_type) {
      query.andWhere(':donation_type = ANY(donor.donation_types)', { donation_type: filters.donation_type });
    }
    if (filters.wilaya_id) {
      query.andWhere('donor.wilaya_id = :wilaya_id', { wilaya_id: filters.wilaya_id });
    }
    if (filters.availability_status) {
      query.andWhere('donor.availability_status = :availability_status', { availability_status: filters.availability_status });
    }

    const donors = await query.getMany();
    return donors.map((d) => this.sanitize(d));
  }

  async findOne(id: string, includeContact = false): Promise<Donor> {
    const donor = await this.donorRepository.findOne({ where: { id }, relations: ['user'] });
    if (!donor) throw new NotFoundException(`Donneur ${id} introuvable`);
    return includeContact ? donor : this.sanitize(donor);
  }

  async findByUserId(userId: string): Promise<Donor> {
    // "Mon profil" - l'utilisateur voit toujours ses propres coordonnees
    return this.donorRepository.findOne({ where: { userId }, relations: ['user'] });
  }

  async update(id: string, updateData: Partial<CreateDonorDto>): Promise<Donor> {
    await this.donorRepository.update(id, updateData);
    return this.findOne(id, true);
  }
}
