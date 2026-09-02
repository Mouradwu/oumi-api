import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Auteur de la notification (ex: demandeur qui contacte un donneur).
  // Nullable : les notifications systeme (ex: "Aide acceptee" generees
  // automatiquement) n'ont pas d'expediteur humain.
  @Column({ name: 'sender_id', type: 'uuid', nullable: true })
  senderId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  body: string;

  @Column({ length: 50 })
  type: string; // 'new_request', 'match_found', 'message', 'system'

  @Column({ default: false })
  is_read: boolean;

  @Column({ type: 'jsonb', nullable: true })
  data: any;

  @CreateDateColumn()
  created_at: Date;
}