import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Wilaya } from './wilaya.entity';
import { Commune } from './commune.entity';

@Entity('dairas')
export class Daira {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 10 })
  code: string;

  @Column()
  name_fr: string;

  @Column()
  name_ar: string;

  @Column()
  wilaya_code: string;

  @ManyToOne(() => Wilaya)
  @JoinColumn({ name: 'wilaya_code', referencedColumnName: 'code' })
  wilaya: Wilaya;

  @OneToMany(() => Commune, commune => commune.daira)
  communes: Commune[];
}