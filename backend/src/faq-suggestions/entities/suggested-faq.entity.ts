import { Column, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * Stores the most recently generated FAQ suggestions for a shop.
 * One row per shop — upserted after each successful FAQ generation run.
 */
@Entity('suggested_faqs')
@Index(['shopId'], { unique: true })
export class SuggestedFaq {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  shopId!: string;

  /** The 3 generated/rephrased questions as a JSON array. */
  @Column('jsonb')
  questions!: string[];

  /** Timestamp of the last successful generation. Used to check cron interval. */
  @UpdateDateColumn()
  generatedAt!: Date;
}
