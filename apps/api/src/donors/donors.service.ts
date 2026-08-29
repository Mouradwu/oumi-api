import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donor } from './donor.entity';
import { CreateDonorDto } from './dto/create-donor.dto';

@Injectable()
export class DonorsService {
  constructor(
    @InjectRepository(Donor)
    private donorsRepository: Repository<Donor>,
  ) {}

  async createOrUpdate(userId: string, dto: CreateDonorDto): Promise<Donor> {
    let donor = await this.donorsRepository.findOne({ where: { user: { id: userId } } });
    
    // S'assurer que donation_types est bien un tableau
    const types = Array.isArray(dto.donation_types) ? dto.donation_types : (dto.donation_types ? [dto.donation_types] : []);

    if (donor) {
      donor.blood_type = dto.blood_type;
      donor.donation_types = types;
      donor.wilaya_id = dto.wilaya_id || null;
      donor.latitude = dto.latitude || null;
      donor.longitude = dto.longitude || null;
      donor.availability_status = dto.availability_status || 'green';
      donor.last_donation_date = dto.last_donation_date ? new Date(dto.last_donation_date) : null;
    } else {
      donor = this.donorsRepository.create({
        blood_type: dto.blood_type,
        donation_types: types,
        wilaya_id: dto.wilaya_id || null,
        latitude: dto.latitude || null,
        longitude: dto.longitude || null,
        availability_status: dto.availability_status || 'green',
        last_donation_date: dto.last_donation_date ? new Date(dto.last_donation_date) : null,
        user: { id: userId } as any,
      });
    }
    
    return this.donorsRepository.save(donor);
  }

  async getMyProfile(userId: string): Promise<Donor> {
    const donor = await this.donorsRepository.findOne({ 
      where: { user: { id: userId } },
      relations: ['user']
    });
    if (!donor) {
      throw new NotFoundException('Profil donneur non trouve.');
    }
    return donor;
  }

  async findAll(): Promise<Donor[]> {
    return this.donorsRepository.find({
      where: { availability_status: 'green' },
      take: 50,
    });
  }
}