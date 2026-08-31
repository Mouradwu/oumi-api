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

  async findAll(filters: any): Promise<Donor[]> {
            const query = this.donorRepository.createQueryBuilder('donor')
            .leftJoinAndSelect('donor.user', 'user')
            .where('1=1');

        if (filters.blood_group) {
            query.andWhere('donor.blood_group = :blood_group', { blood_group: filters.blood_group });
        }
        if (filters.donation_type) {
            query.andWhere('donor.donation_types LIKE :donation_type', { donation_type: `%${filters.donation_type}%` });
        }
        if (filters.wilaya) {
            query.andWhere('donor.wilaya = :wilaya', { wilaya: filters.wilaya });
        }
        if (filters.availability === 'true') {
            query.andWhere('donor.availability = true');
        }

        return query.getMany();
  }

  async findOne(id: number): Promise<Donor> {
    const donor = await this.donorRepository.findOne({ where: { id }, relations: ['user'] });
    if (!donor) throw new NotFoundException(`Donor with ID ${id} not found`);
    return donor;
  }

  async findByUserId(userId: string): Promise<Donor> {
    return this.donorRepository.findOne({ where: { userId }, relations: ['user'] });
  }

  async update(id: number, updateData: Partial<CreateDonorDto>): Promise<Donor> {
    await this.donorRepository.update(id, updateData);
    return this.findOne(id);
  }
}
