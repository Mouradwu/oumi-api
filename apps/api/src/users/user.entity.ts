import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne } from 'typeorm';
import { Donor } from '../donors/entities/donor.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ length: 50 })
  first_name: string;

  @Column({ length: 50, nullable: true })
  last_name: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ default: 'donor' })
  role: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_verified: boolean;

  @OneToOne(() => Donor, (donor) => donor.user)
  donor: Donor;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}


