import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('donors')
export class Donor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.donor, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 5 })
  blood_type: string;

  @Column({ type: 'text', array: true, nullable: true })
  donation_types: string[];

  @Column({ nullable: true })
  wilaya_id: number;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ default: 'green' })
  availability_status: string;

  @Column({ type: 'date', nullable: true })
  last_donation_date: Date;

  @Column({ default: false })
  is_verified: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}