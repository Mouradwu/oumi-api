import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('donation_requests')
export class DonationRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 10 })
  blood_group: string;

  @Column({ length: 20 })
  donation_type: string;

  @Column({ length: 10 })
  wilaya: string;

  @Column({ nullable: true })
  hospital: string;

  @Column({ length: 20, default: 'NORMAL' })
  urgency: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  patient_name: string;

  @Column({ nullable: true })
  patient_age: number;

  @Column({ nullable: true })
  quantity: number;

  @Column({ nullable: true })
  contact_phone: string;

  @Column({ length: 20, default: 'pending' })
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}