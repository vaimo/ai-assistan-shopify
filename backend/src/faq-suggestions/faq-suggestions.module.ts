import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigRegistryService } from '../config-registry/config-registry.service';
import { ShopsModule } from '../shops/shops.module';
import { FaqSuggestionsService } from './faq-suggestions.service';
import { FaqSuggestionsController } from './faq-suggestions.controller';
import { SuggestedFaq } from './entities/suggested-faq.entity';
import { FaqQuestionPool } from './entities/faq-question-pool.entity';

/**
 * FAQ Suggestions module.
 * Manages AI-generated suggested questions shown on the empty chat screen.
 *
 * Config namespace: `faq_suggestions`
 * Fields:
 *   - general.enable              — toggle   (1 = enabled, generate via cron)
 *   - general.cron_interval_hours — number   (hours between regeneration runs, default 24)
 *   - general.fallback_q1         — text     (shown when FAQ is disabled or not yet generated)
 *   - general.fallback_q2         — text
 *   - general.fallback_q3         — text
 */
@Module({
  imports: [TypeOrmModule.forFeature([SuggestedFaq, FaqQuestionPool]), ShopsModule],
  providers: [FaqSuggestionsService],
  controllers: [FaqSuggestionsController],
  exports: [FaqSuggestionsService],
})
export class FaqSuggestionsModule implements OnModuleInit {
  constructor(private readonly configRegistry: ConfigRegistryService) {}

  onModuleInit(): void {
    this.configRegistry.register(
      'faq_suggestions',
      {
        general: {
          enable: 1,
          cron_interval_hours: 24,
          fallback_q1: 'What the ingegrations are available for current project?',
          fallback_q2: 'Provide a summary of the current project.',
          fallback_q3: "How can I improve my store's conversion rate?",
        },
      },
      {
        moduleLabel: 'FAQ Suggestions',
        fields: {
          'general.enable': {
            groupLabel: 'General',
            keyLabel: 'Enable AI-generated suggestions',
            fieldType: 'toggle',
            toggleOptions: [
              { label: 'Enabled', value: 1 },
              { label: 'Disabled', value: 0 },
            ],
          },
          'general.cron_interval_hours': {
            groupLabel: 'General',
            keyLabel: 'Regeneration interval (hours)',
            fieldType: 'number',
            min: 1,
            max: 168,
            validationMessage: 'Must be between 1 and 168 hours (1 week)',
          },
          'general.fallback_q1': {
            groupLabel: 'Fallback questions (shown when disabled or not yet generated)',
            keyLabel: 'Question 1',
            fieldType: 'text',
          },
          'general.fallback_q2': {
            groupLabel: 'Fallback questions (shown when disabled or not yet generated)',
            keyLabel: 'Question 2',
            fieldType: 'text',
          },
          'general.fallback_q3': {
            groupLabel: 'Fallback questions (shown when disabled or not yet generated)',
            keyLabel: 'Question 3',
            fieldType: 'text',
          },
        },
      },
    );
  }
}
