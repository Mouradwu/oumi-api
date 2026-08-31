import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Daira } from './daira.entity';

@Entity('wilayas')
export class Wilaya {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 10 })
  code: string;

  @Column()
  name_fr: string;

  @Column()
  name_ar: string;

  @Column('float', { nullable: true })
  latitude: number;

  @Column('float', { nullable: true })
  longitude: number;

  @OneToMany(() => Daira, daira => daira.wilaya)
  dairas: Daira[];
}