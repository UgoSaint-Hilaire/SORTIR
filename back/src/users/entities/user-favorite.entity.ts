import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from './user.entity';

@Entity('user_favorites')
@Unique(['userId', 'eventId'])
export class UserFavorite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  eventId: string; // Peut être ticketmasterId ou _id selon la source

  @Column()
  eventName: string;

  @Column({ nullable: true })
  eventDate: string;

  @Column({ nullable: true })
  eventVenue: string;

  @Column({ nullable: true })
  eventCity: string;

  @Column({ nullable: true })
  eventImage: string;

  @Column({ nullable: true })
  eventUrl: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}