import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('hospitals')
export class Hospital {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name_fr: string;

  @Column({ length: 255, nullable: true })
  name_ar: string;

  @Column({ length: 50, nullable: true })
  type: string;

  @Column({ nullable: true })
  wilaya_id: number;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  phone: string;

  @CreateDateColumn()
  created_at: Date;
}
