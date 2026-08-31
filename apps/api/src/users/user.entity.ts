import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Donor } from '../donors/entities/donor.entity';
import { DonationRequest } from '../requests/entities/request.entity';

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

  @Column()
  password: string;

  @Column({ nullable: true })
  phone: string;

  @Column('text', { array: true, nullable: true, default: '{}' })
  roles: string[];

  @OneToMany(() => Donor, donor => donor.user)
  donors: Donor[];

  @OneToMany(() => DonationRequest, request => request.user)
  requests: DonationRequest[];
}
