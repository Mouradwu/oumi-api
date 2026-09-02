import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Donor } from '../donors/entities/donor.entity';
import { DonationRequest } from '../requests/donation-request.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ unique: true })
  email: string;

  // Jamais renvoye dans les reponses API (voir ClassSerializerInterceptor
  // active globalement dans main.ts).
  @Exclude()
  @Column()
  password: string;

  @Column({ nullable: true })
  phone: string;

  @Column('text', { array: true, nullable: true, default: '{}' })
  roles: string[];

  @Column({ default: true })
  is_active: boolean;

  @OneToMany(() => Donor, donor => donor.user)
  donors: Donor[];

  @OneToMany(() => DonationRequest, request => request.requester)
  requests: DonationRequest[];
}
