import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SourceDocument } from '../lokte.service';
import { ChatSession } from './chat-session.entity';

@Entity('chat_messages')
@Index(['chatSessionId'])
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  shopId!: string;

  @Column()
  userId!: string;

  @Column()
  chatSessionId!: string;

  @ManyToOne(() => ChatSession, (session) => session.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chatSessionId' })
  session!: ChatSession;

  @Column()
  role!: 'user' | 'assistant';

  @Column('text')
  content!: string;

  @Column({ default: false })
  isError!: boolean;

  @Column('jsonb', { nullable: true, default: null })
  documents!: SourceDocument[] | null;

  @CreateDateColumn()
  createdAt!: Date;
}
