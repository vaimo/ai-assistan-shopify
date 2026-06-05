import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Append-only log of user questions collected between FAQ generation runs.
 * Questions accumulate here regardless of chat history clears.
 * After a successful FAQ generation, all rows for the shop are deleted.
 */
@Entity('faq_question_pool')
@Index(['shopId', 'createdAt'])
export class FaqQuestionPool {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  shopId!: string;

  @Column('text')
  question!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
