import { describe, expect, it } from 'vitest';
import { parseFollowUpQuestions } from './follow-up-questions';

describe('parseFollowUpQuestions', () => {
  it('parses bulleted questions and strips the marker block from content', () => {
    const result = parseFollowUpQuestions(
      `Here is the answer.

<FOLLOW_UP_QUESTIONS>
- Would you like order details?
- Should I compare conversion rates?
</FOLLOW_UP_QUESTIONS>`,
      3,
    );

    expect(result.content).toBe('Here is the answer.');
    expect(result.questions).toEqual([
      'Would you like order details?',
      'Should I compare conversion rates?',
    ]);
  });

  it('parses numbered questions, limits by count, and removes duplicates', () => {
    const result = parseFollowUpQuestions(
      `Answer.

<FOLLOW_UP_QUESTIONS>
1. What changed this week?
2. What changed this week?
3. Which products need attention?
4. Should I draft a summary?
</FOLLOW_UP_QUESTIONS>`,
      2,
    );

    expect(result.content).toBe('Answer.');
    expect(result.questions).toEqual([
      'What changed this week?',
      'Which products need attention?',
    ]);
  });

  it('strips accidental angle brackets around a follow-up item', () => {
    const result = parseFollowUpQuestions(
      `Answer.

<FOLLOW_UP_QUESTIONS>
- <Link me to the Confluence page that mentions Klevu.>
</FOLLOW_UP_QUESTIONS>`,
      3,
    );

    expect(result.questions).toEqual([
      'Link me to the Confluence page that mentions Klevu.',
    ]);
  });

  it('hides marker blocks but renders no questions when count is 0', () => {
    const result = parseFollowUpQuestions(
      `Answer.

<FOLLOW_UP_QUESTIONS>
- Should I continue?
</FOLLOW_UP_QUESTIONS>`,
      0,
    );

    expect(result.content).toBe('Answer.');
    expect(result.questions).toEqual([]);
  });

  it('leaves normal answers unchanged when no marker block exists', () => {
    const result = parseFollowUpQuestions('Plain answer without follow-ups.', 3);

    expect(result.content).toBe('Plain answer without follow-ups.');
    expect(result.questions).toEqual([]);
  });
});
