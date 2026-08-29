import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wilaya } from './wilaya.entity';

@Injectable()
export class WilayaService {
  constructor(
    @InjectRepository(Wilaya)
    private wilayaRepository: Repository<Wilaya>,
  ) {}

  findAll(): Promise<Wilaya[]> {
    return this.wilayaRepository.find({ order: { code: 'ASC' } });
  }

  findOne(id: number): Promise<Wilaya> {
    return this.wilayaRepository.findOne({ where: { id } });
  }
}
