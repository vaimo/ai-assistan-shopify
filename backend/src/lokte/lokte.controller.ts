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
import { LokteService, SourceDocument, ChatSummary } from './lokte.service';
import { AskQuestionDto } from './dtos/ask-question.dto';
import { ChatMessage } from './entities/chat-message.entity';

type AuthedRequest = Request & { shopifyUserId: string };

@Controller('lokte')
@UseGuards(ShopifySessionGuard, ShopParamGuard)
export class LokteController {
  constructor(private readonly lokteService: LokteService) {}

  /** GET /lokte/:shopId/chats — list all chat sessions for the user */
  @Get(':shopId/chats')
  listChats(
    @Param('shopId') shopId: string,
    @Req() req: AuthedRequest,
  ): Promise<ChatSummary[]> {
    return this.lokteService.listChats(shopId, req.shopifyUserId);
  }

  /** GET /lokte/:shopId/chats/:chatId/history — messages for a specific chat */
  @Get(':shopId/chats/:chatId/history')
  getHistory(
    @Param('shopId') shopId: string,
    @Param('chatId') chatId: string,
    @Req() req: AuthedRequest,
  ): Promise<ChatMessage[]> {
    return this.lokteService.getHistory(shopId, req.shopifyUserId, chatId);
  }

  /** DELETE /lokte/:shopId/chats/:chatId — delete a single chat */
  @Delete(':shopId/chats/:chatId')
  @HttpCode(HttpStatus.OK)
  async deleteChat(
    @Param('shopId') shopId: string,
    @Param('chatId') chatId: string,
    @Req() req: AuthedRequest,
  ): Promise<{ deleted: boolean }> {
    await this.lokteService.deleteChat(shopId, req.shopifyUserId, chatId);
    return { deleted: true };
  }

  /** DELETE /lokte/:shopId/history — clear ALL chat history for the user */
  @Delete(':shopId/history')
  @HttpCode(HttpStatus.OK)
  async clearAllHistory(
    @Param('shopId') shopId: string,
    @Req() req: AuthedRequest,
  ): Promise<{ cleared: boolean }> {
    await this.lokteService.clearAllHistory(shopId, req.shopifyUserId);
    return { cleared: true };
  }

  /** POST /lokte/:shopId/question */
  @Post(':shopId/question')
  @HttpCode(HttpStatus.OK)
  async askQuestion(
    @Param('shopId') shopId: string,
    @Body() dto: AskQuestionDto,
    @Req() req: AuthedRequest,
  ): Promise<{ answer: string; documents: SourceDocument[]; chatId: string }> {
    return this.lokteService.askQuestion(shopId, req.shopifyUserId, dto.question, dto.chatId);
  }
}
