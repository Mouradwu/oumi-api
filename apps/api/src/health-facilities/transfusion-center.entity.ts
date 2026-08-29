import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('transfusion_centers')
export class TransfusionCenter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name_fr: string;

  @Column({ length: 255, nullable: true })
  name_ar: string;

  @Column({ nullable: true })
  wilaya_id: number;

  @Column({ nullable: true })
  address: string;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'text', array: true, nullable: true })
  accepted_donation_types: string[];

  @Column({ default: false })
  verified: boolean;

  @CreateDateColumn()
  created_at: Date;
}