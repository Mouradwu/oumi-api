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

    return query.getMany();
  }

  async findOne(id: string): Promise<Donor> {
    const donor = await this.donorRepository.findOne({ where: { id }, relations: ['user'] });
    if (!donor) throw new NotFoundException(`Donneur ${id} introuvable`);
    return donor;
  }

  async findByUserId(userId: string): Promise<Donor> {
    return this.donorRepository.findOne({ where: { userId }, relations: ['user'] });
  }

  async update(id: string, updateData: Partial<CreateDonorDto>): Promise<Donor> {
    await this.donorRepository.update(id, updateData);
    return this.findOne(id);
  }
}
