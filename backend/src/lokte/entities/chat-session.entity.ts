import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ChatMessage } from './chat-message.entity';

@Entity('chat_sessions')
@Index(['shopId', 'userId'])
export class ChatSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  shopId!: string;

  @Column()
  userId!: string;

  /** Lokte chat_session_id (UUID) — null until the first message is sent */
  @Column({ type: 'varchar', nullable: true })
  lokteSessionId!: string | null;

  /** reserved_assistant_message_id from the last Lokte reply — used as parent_message_id on the next send */
  @Column({ type: 'int', nullable: true })
  lastAssistantMsgId!: number | null;

  /** Auto-generated from the first user message (truncated to 80 chars) */
  @Column({ length: 80, default: '' })
  title!: string;

  @OneToMany(() => ChatMessage, (msg) => msg.session)
  messages!: ChatMessage[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
