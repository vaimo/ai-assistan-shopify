import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { ShopifySessionGuard } from '../auth/guards/shopify-session.guard';
import { ShopParamGuard } from '../auth/guards/shop-param.guard';
import { FaqSuggestionsService } from './faq-suggestions.service';

interface FaqResponse {
  questions: string[] | null;
  lastGeneratedAt: string | null;
  enabled: boolean;
}

@Controller('faq')
@UseGuards(ShopifySessionGuard, ShopParamGuard)
export class FaqSuggestionsController {
  constructor(private readonly faqService: FaqSuggestionsService) {}

  /** GET /faq/:shopId — returns current suggested FAQ questions and generation timestamp */
  @Get(':shopId')
  async getSuggestedFaqs(@Param('shopId') shopId: string): Promise<FaqResponse> {
    const enabled = await this.faqService.isFaqEnabled(shopId);
    const [questions, lastGeneratedAt] = enabled ? await Promise.all([
      this.faqService.getSuggestedFaqs(shopId),
      this.faqService.getLastGeneratedAt(shopId),
    ]) : [await this.faqService.getFallbackFaqs(shopId), null];

    return {
      questions,
      lastGeneratedAt: lastGeneratedAt?.toISOString() ?? null,
      enabled,
    };
  }

  /** POST /faq/:shopId/generate — force-triggers FAQ regeneration for the shop */
  @Post(':shopId/generate')
  @HttpCode(HttpStatus.OK)
  async forceGenerate(@Param('shopId') shopId: string): Promise<FaqResponse> {
    const enabled = await this.faqService.isFaqEnabled(shopId);
    if (!enabled) {
      throw new ServiceUnavailableException('FAQ generation is disabled for this shop');
    }

    await this.faqService.generateFaqForShop(shopId);
    // Always return the current persisted state, even if generation was skipped.
    // This ensures the frontend never clears existing questions on a skipped run.
    const [questions, lastGeneratedAt] = await Promise.all([
      this.faqService.getSuggestedFaqs(shopId),
      this.faqService.getLastGeneratedAt(shopId),
    ]);
    return {
      questions,
      lastGeneratedAt: lastGeneratedAt?.toISOString() ?? null,
      enabled,
    };
  }
}
