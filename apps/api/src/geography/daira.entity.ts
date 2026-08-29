import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Wilaya } from './wilaya.entity';

@Entity('dairas')
export class Daira {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name_fr: string;

  @Column({ length: 100, nullable: true })
  name_ar: string;

  @Column({ length: 10 })
  code: string;

  @ManyToOne(() => Wilaya)
  @JoinColumn({ name: 'wilaya_id' })
  wilaya: Wilaya;
}
