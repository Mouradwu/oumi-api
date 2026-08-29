import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('wilayas')
export class Wilaya {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 10, unique: true })
  code: string;

  @Column({ length: 100 })
  name_fr: string;

  @Column({ length: 100, nullable: true })
  name_ar: string;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  longitude: number;
}
