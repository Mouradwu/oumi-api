import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Donor } from '../donors/entities/donor.entity';
import { DonationRequest } from '../requests/entities/request.entity';

@Injectable()
export class MatchingService {
  constructor(
    @InjectRepository(Donor)
    private donorRepository: Repository<Donor>,
    @InjectRepository(DonationRequest)
    private requestRepository: Repository<DonationRequest>,
  ) {}

  async findMatches(requestId: number) {
    const request = await this.requestRepository.findOne({ where: { id: requestId } });
    if (!request) throw new Error('Request not found');

    const compatibleGroups = this.getCompatibleBloodGroups(request.blood_group);
    
    // Utiliser l'opérateur In pour rechercher plusieurs groupes sanguins
    const donors = await this.donorRepository.find({
      where: { 
        blood_group: In(compatibleGroups),
        availability: true 
      },
      relations: ['user'],
    });

    return donors.map(donor => ({
      id: donor.id,
      donor: {
        ...donor,
        distance: Math.random() * 50,
      },
      score: Math.floor(Math.random() * 100),
      compatibility: 'good',
    }));
  }

  getCompatibleBloodGroups(blood_group: string): string[] {
    const compatibility: Record<string, string[]> = {
      'A+': ['A+', 'A-', 'O+', 'O-'],
      'A-': ['A-', 'O-'],
      'B+': ['B+', 'B-', 'O+', 'O-'],
      'B-': ['B-', 'O-'],
      'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      'AB-': ['AB-', 'A-', 'B-', 'O-'],
      'O+': ['O+', 'O-'],
      'O-': ['O-'],
    };
    return compatibility[blood_group] || [];
  }
}