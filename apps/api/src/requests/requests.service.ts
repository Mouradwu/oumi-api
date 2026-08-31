import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DonationRequest } from './entities/request.entity';
import { CreateRequestDto } from './dto/create-request.dto';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(DonationRequest)
    private requestRepository: Repository<DonationRequest>,
  ) {}

  async create(createRequestDto: CreateRequestDto): Promise<DonationRequest> {
    const request = this.requestRepository.create(createRequestDto);
    return this.requestRepository.save(request);
  }

  async findAll(): Promise<DonationRequest[]> {
    return this.requestRepository.find({ relations: ['user'] });
  }

  async findOne(id: number): Promise<DonationRequest> {
    const request = await this.requestRepository.findOne({ where: { id }, relations: ['user'] });
    if (!request) throw new NotFoundException(`Request with ID ${id} not found`);
    return request;
  }

  async findByUserId(userId: string): Promise<DonationRequest[]> {
    return this.requestRepository.find({ where: { userId }, relations: ['user'] });
  }

  async updateStatus(id: number, status: string): Promise<DonationRequest> {
    await this.requestRepository.update(id, { status });
    return this.findOne(id);
  }
}