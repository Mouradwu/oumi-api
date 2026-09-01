import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Donor } from '../donors/entities/donor.entity';
import { DonationRequest } from '../requests/donation-request.entity';

@Injectable()
export class MatchingService {
  constructor(
    @InjectRepository(Donor)
    private donorRepository: Repository<Donor>,
    @InjectRepository(DonationRequest)
    private requestRepository: Repository<DonationRequest>,
  ) {}

  async findMatches(requestId: string) {
    const request = await this.requestRepository.findOne({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Demande introuvable');

    const compatibleGroups = this.getCompatibleBloodGroups(request.blood_type);
    const donors = await this.donorRepository.find({
      where: {
        blood_type: In(compatibleGroups),
        availability_status: 'green',
        ...(request.wilaya_id ? { wilaya_id: request.wilaya_id } : {}),
      },
      relations: ['user'],
    });

    return donors.map((donor) => ({
      id: donor.id,
      donor: { ...donor, distance: Math.random() * 50 }, // a remplacer par un calcul GPS reel
      score: Math.floor(Math.random() * 100),
      compatibility: 'good',
    }));
  }

  getCompatibleBloodGroups(blood_type: string): string[] {
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
    return compatibility[blood_type] || [];
  }
}
