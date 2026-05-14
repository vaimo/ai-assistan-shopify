import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ShopifySessionGuard } from '../auth/guards/shopify-session.guard';
import { LokteService, SourceDocument } from './lokte.service';
import { AskQuestionDto } from './dtos/ask-question.dto';

@Controller('lokte')
@UseGuards(ShopifySessionGuard)
export class LokteController {
  constructor(private readonly lokteService: LokteService) {}

  /** POST /lokte/:shopId/question */
  @Post(':shopId/question')
  @HttpCode(HttpStatus.OK)
  async askQuestion(
    @Param('shopId') shopId: string,
    @Body() dto: AskQuestionDto,
  ): Promise<{ answer: string; documents: SourceDocument[] }> {
    const result = await this.lokteService.askQuestion(shopId, dto.question);
    return result;
  }
}
