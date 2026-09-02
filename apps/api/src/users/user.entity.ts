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

  @Column({ default: false })
  email_verified: boolean;

  @Exclude()
  @Column({ nullable: true })
  email_verification_token: string;

  @Exclude()
  @Column({ type: 'timestamp', nullable: true })
  email_verification_expires: Date;

  @Column({ default: false })
  phone_verified: boolean;

  @Exclude()
  @Column({ nullable: true })
  phone_otp_code: string;

  @Exclude()
  @Column({ type: 'timestamp', nullable: true })
  phone_otp_expires: Date;

  @Column({ default: 'pending_verification' })
  account_status: string;

  @OneToMany(() => Donor, donor => donor.user)
  donors: Donor[];

  @OneToMany(() => DonationRequest, request => request.requester)
  requests: DonationRequest[];
}
