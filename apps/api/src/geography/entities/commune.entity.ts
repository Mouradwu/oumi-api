import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Daira } from './daira.entity';

@Entity('communes')
export class Commune {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 10 })
  code: string;

  @Column()
  name_fr: string;

  @Column()
  name_ar: string;

  @Column()
  daira_code: string;

  @ManyToOne(() => Daira)
  @JoinColumn({ name: 'daira_code', referencedColumnName: 'code' })
  daira: Daira;

  @Column('float', { nullable: true })
  latitude: number;

  @Column('float', { nullable: true })
  longitude: number;
}