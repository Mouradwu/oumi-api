import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('donors')
export class Donor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 10 })
  blood_group: string;

  @Column('simple-array')
  donation_types: string[];

  @Column({ length: 10 })
  wilaya: string;

  @Column('float', { default: 0 })
  latitude: number;

  @Column('float', { default: 0 })
  longitude: number;

  @Column({ default: true })
  availability: boolean;

  @Column({ default: false })
  certified: boolean;

  @Column({ default: false })
  has_donated_before: boolean;

  @Column({ nullable: true })
  last_donation_date: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}