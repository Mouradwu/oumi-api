import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wilaya } from './entities/wilaya.entity';
import { Daira } from './entities/daira.entity';
import { Commune } from './entities/commune.entity';

@Injectable()
export class GeographyService {
  constructor(
    @InjectRepository(Wilaya) private wilayaRepo: Repository<Wilaya>,
    @InjectRepository(Daira) private dairaRepo: Repository<Daira>,
    @InjectRepository(Commune) private communeRepo: Repository<Commune>,
  ) {}

  async getWilayas() {
    return this.wilayaRepo.find();
  }

  async getWilayaById(code: string) {
    return this.wilayaRepo.findOne({ where: { code } });
  }

  async getDairas(wilayaCode?: string) {
    return wilayaCode ? this.dairaRepo.find({ where: { wilaya_code: wilayaCode } }) : this.dairaRepo.find();
  }

  async getCommunes(dairaCode?: string) {
    return dairaCode ? this.communeRepo.find({ where: { daira_code: dairaCode } }) : this.communeRepo.find();
  }
}