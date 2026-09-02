import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('osm_health_facilities')
export class Facility {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', nullable: true, unique: true })
  osm_id: number;

  // pharmacy | doctors | clinic | dentist | hospital
  @Column({ length: 20 })
  category: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  name_ar: string;

  @Column({ nullable: true })
  addr_city: string;

  @Column({ nullable: true })
  wilaya_id: number;

  @Column({ nullable: true })
  specialty: string;

  @Column('decimal', { precision: 10, scale: 7 })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 7 })
  longitude: number;
}
