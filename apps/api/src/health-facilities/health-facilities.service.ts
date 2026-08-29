import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hospital } from '../hospitals/hospital.entity';
import { TransfusionCenter } from './transfusion-center.entity';

@Injectable()
export class HealthFacilitiesService {
  constructor(
    @InjectRepository(Hospital) private hospitalRepo: Repository<Hospital>,
    @InjectRepository(TransfusionCenter) private centerRepo: Repository<TransfusionCenter>,
  ) {}

  // Hôpitaux
  async findAllHospitals(wilayaId?: number) {
    const where = wilayaId ? { wilaya_id: wilayaId } : {};
    return this.hospitalRepo.find({ where, take: 100 });
  }

  async createHospital(data: Partial<Hospital>) {
    const hospital = this.hospitalRepo.create(data);
    return this.hospitalRepo.save(hospital);
  }

  // Centres de Transfusion
  async findAllCenters(wilayaId?: number) {
    const where = wilayaId ? { wilaya_id: wilayaId } : {};
    return this.centerRepo.find({ where, take: 100 });
  }

  async createCenter(data: Partial<TransfusionCenter>) {
    const center = this.centerRepo.create(data);
    return this.centerRepo.save(center);
  }
}