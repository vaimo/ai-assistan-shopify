import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigRegistryService } from '../config-registry/config-registry.service';

@Module({})
export class FollowUpQuestionsModule implements OnModuleInit {
  constructor(private readonly configRegistry: ConfigRegistryService) {}

  onModuleInit(): void {
    this.configRegistry.register(
      'follow_up_questions',
      {
        general: {
          count: 3,
        },
      },
      {
        moduleLabel: 'Follow-up questions',
        fields: {
          'general.count': {
            groupLabel: 'Follow-up questions counter',
            keyLabel: 'Choose how many questions appear at the end of a response. Set 0 to disable',
            helpText: 'Controls the related-question buttons shown under each assistant reply.',
            fieldType: 'number',
            min: 0,
            max: 5,
            validationMessage: 'Must be between 0 and 5 follow-up questions',
          },
        },
      },
    );
  }
}
