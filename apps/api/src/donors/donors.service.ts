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

  async findAll(): Promise<Donor[]> {
    return this.donorRepository.find({ relations: ['user'] });
  }

  async findOne(id: number): Promise<Donor> {
    const donor = await this.donorRepository.findOne({ 
      where: { id }, 
      relations: ['user'] 
    });
    if (!donor) {
      throw new NotFoundException(`Donor with ID ${id} not found`);
    }
    return donor;
  }

  async findByUserId(userId: number): Promise<Donor> {
    const donor = await this.donorRepository.findOne({ 
      where: { userId }, 
      relations: ['user'] 
    });
    return donor;
  }

  async update(id: number, updateData: Partial<CreateDonorDto>): Promise<Donor> {
    await this.donorRepository.update(id, updateData);
    return this.findOne(id);
  }
}