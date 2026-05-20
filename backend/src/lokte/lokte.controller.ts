import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ShopifySessionGuard } from '../auth/guards/shopify-session.guard';
import { ShopParamGuard } from '../auth/guards/shop-param.guard';
import { LokteService, SourceDocument } from './lokte.service';
import { AskQuestionDto } from './dtos/ask-question.dto';
import { ChatMessage } from './entities/chat-message.entity';

type AuthedRequest = Request & { shopifyUserId: string };

@Controller('lokte')
@UseGuards(ShopifySessionGuard, ShopParamGuard)
export class LokteController {
  constructor(private readonly lokteService: LokteService) {}

  /** GET /lokte/:shopId/history */
  @Get(':shopId/history')
  getHistory(
    @Param('shopId') shopId: string,
    @Req() req: AuthedRequest,
  ): Promise<ChatMessage[]> {
    return this.lokteService.getHistory(shopId, req.shopifyUserId);
  }

  /** DELETE /lokte/:shopId/history */
  @Delete(':shopId/history')
  @HttpCode(HttpStatus.OK)
  async clearHistory(
    @Param('shopId') shopId: string,
    @Req() req: AuthedRequest,
  ): Promise<{ cleared: boolean }> {
    await this.lokteService.clearHistory(shopId, req.shopifyUserId);
    return { cleared: true };
  }

  /** POST /lokte/:shopId/question */
  @Post(':shopId/question')
  @HttpCode(HttpStatus.OK)
  async askQuestion(
    @Param('shopId') shopId: string,
    @Body() dto: AskQuestionDto,
    @Req() req: AuthedRequest,
  ): Promise<{ answer: string; documents: SourceDocument[] }> {
    return this.lokteService.askQuestion(shopId, req.shopifyUserId, dto.question);
  }
}
