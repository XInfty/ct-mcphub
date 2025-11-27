import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'vector_embeddings' })
export class VectorEmbedding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', default: 'unknown' })
  content_type: string; // 'market_server', 'tool', 'documentation', etc.

  @Column({ type: 'varchar', default: '' })
  content_id: string; // Reference ID to the original content

  @Column('text')
  text_content: string; // The text that was embedded

  @Column('simple-json')
  metadata: Record<string, any>; // Additional metadata about the embedding

  @Column({
    type: 'varchar',
    nullable: true,
  })
  embedding: string | number[]; // The vector embedding - stored as pgvector format string

  @Column({ type: 'int' })
  dimensions: number; // Dimensionality of the embedding vector

  @Column({ type: 'varchar' })
  model: string; // Model used to create the embedding

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}

export default VectorEmbedding;
