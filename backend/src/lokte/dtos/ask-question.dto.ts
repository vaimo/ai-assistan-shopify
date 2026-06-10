import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class AskQuestionDto {
  @IsString()
  @IsNotEmpty()
  question!: string;

  /** If provided, the message is appended to this existing chat session. */
  @IsOptional()
  @IsUUID()
  chatId?: string;
}

