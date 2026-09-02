import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

// draft -> active <-> inactive ; devient "ended" (calcule, pas stocke) des
// que end_date est depassee.
export type CampaignStatus = 'draft' | 'active' | 'inactive' | 'ended';

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'organizer_id' })
  organizer: User;

  @Column({ length: 50, nullable: true })
  organizer_type: string;

  @Column({ type: 'timestamp' })
  start_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_date: Date;

  @Column({ nullable: true })
  hours_label: string;

  @Column({ nullable: true })
  wilaya_id: number;

  @Column({ nullable: true })
  commune_id: number;

  @Column({ type: 'text', nullable: true })
  location: string;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ type: 'text', array: true, nullable: true })
  donation_types: string[];

  @Column({ type: 'text', array: true, nullable: true })
  blood_types_needed: string[];

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  practical_info: string;

  @Column({ type: 'text', nullable: true })
  image_url: string;

  @Column({ length: 20, nullable: true })
  contact_phone: string;

  @Column({ length: 100, nullable: true })
  contact_name: string;

  @Column({ default: 'Prendre rendez-vous' })
  action_label: string;

  @Column({ default: 0 })
  display_order: number;

  @Column({ default: 'draft' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  published_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
