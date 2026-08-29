import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('donation_requests')
export class DonationRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'requester_id' })
  requester: User;

  @Column({ length: 5 })
  blood_type: string;

  @Column({ length: 20 })
  donation_type: string; // 'Sang', 'Plasma', 'Plaquettes'

  @Column()
  wilaya_id: number;

  @Column({ nullable: true })
  commune_id: number;

  @Column({ length: 255, nullable: true })
  hospital_name: string;

  @Column({ length: 100, nullable: true })
  service: string;

  @Column({ length: 20, default: 'normal' }) // normal, important, urgent, critical
  urgency_level: string;

  @Column({ type: 'date', nullable: true })
  needed_date: Date;

  @Column({ length: 20 })
  contact_phone: string;

  @Column({ type: 'text', nullable: true })
  additional_info: string;

  @Column({ default: 'pending' }) // pending, matched, fulfilled, cancelled
  status: string;

  @Column({ default: false })
  is_verified: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}