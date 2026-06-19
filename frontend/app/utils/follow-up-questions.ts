const FOLLOW_UP_BLOCK_RE = /<FOLLOW_UP_QUESTIONS>([\s\S]*?)<\/FOLLOW_UP_QUESTIONS>/gi;

export interface ParsedFollowUpQuestions {
  content: string;
  questions: string[];
}

function normalizeQuestionLine(line: string): string {
  return line
    .trim()
    .replace(/^[-*\u2022]\s+/, '')
    .replace(/^\d+[\.)]\s+/, '')
    .replace(/^["']|["']$/g, '')
    .replace(/^<(.+)>$/g, '$1')
    .trim();
}

function normalizeCount(count: unknown): number {
  const numeric = Number(count);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.trunc(numeric));
}

export function parseFollowUpQuestions(content: string, count: number): ParsedFollowUpQuestions {
  const blocks = Array.from(content.matchAll(FOLLOW_UP_BLOCK_RE));
  const cleanedContent = content.replace(FOLLOW_UP_BLOCK_RE, '').trim();
  const limit = normalizeCount(count);

  if (blocks.length === 0 || limit === 0) {
    return { content: cleanedContent, questions: [] };
  }

  const finalBlock = blocks[blocks.length - 1]?.[1] ?? '';
  const seen = new Set<string>();
  const questions: string[] = [];

  for (const line of finalBlock.split(/\r?\n/)) {
    const question = normalizeQuestionLine(line);
    if (!question) continue;

    const key = question.toLocaleLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    questions.push(question);
    if (questions.length >= limit) break;
  }

  return { content: cleanedContent, questions };
}
