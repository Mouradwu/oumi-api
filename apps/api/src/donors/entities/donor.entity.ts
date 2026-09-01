import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('donors')
export class Donor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 5 })
  blood_type: string;

  @Column('text', { array: true, nullable: true })
  donation_types: string[];

  @Column({ nullable: true })
  wilaya_id: number;

  @Column({ nullable: true })
  daira_id: number;

  @Column({ nullable: true })
  commune_id: number;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  longitude: number;

  // 'green' | 'orange' | 'red' - statut de disponibilite (feu tricolore)
  @Column({ length: 10, default: 'green' })
  availability_status: string;

  @Column({ type: 'date', nullable: true })
  last_donation_date: Date;

  @Column({ default: false })
  is_verified: boolean;

  @Column({ default: false })
  certified: boolean;

  @Column({ default: false })
  has_donated_before: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
