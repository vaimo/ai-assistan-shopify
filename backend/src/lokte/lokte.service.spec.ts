import { BadGatewayException, ServiceUnavailableException } from '@nestjs/common';
import { LokteService } from './lokte.service';
import { ConfigRegistryService } from '../config-registry/config-registry.service';

const mockConfigGet = jest.fn();
const mockConfigGetDecrypted = jest.fn();

const mockConfigRegistry = {
  get: mockConfigGet,
  getDecrypted: mockConfigGetDecrypted,
} as unknown as ConfigRegistryService;

function makeSut() {
  return new LokteService(mockConfigRegistry);
}

function setupHappyConfig() {
  mockConfigGet.mockImplementation((_shopId: string, path: string) => {
    if (path === 'lokte.general.enable') return Promise.resolve(1);
    if (path === 'lokte.general.user_id') return Promise.resolve('238');
    return Promise.resolve(undefined);
  });
  mockConfigGetDecrypted.mockResolvedValue('test-token');
}

describe('LokteService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('askQuestion — config guards', () => {
    it('throws ServiceUnavailableException when lokte is disabled', async () => {
      mockConfigGet.mockResolvedValue(0);
      mockConfigGetDecrypted.mockResolvedValue('');

      const sut = makeSut();
      await expect(sut.askQuestion('shop.myshopify.com', 'hello')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('throws ServiceUnavailableException when api_key is empty', async () => {
      mockConfigGet.mockImplementation((_shopId: string, path: string) =>
        Promise.resolve(path === 'lokte.general.enable' ? 1 : undefined),
      );
      mockConfigGetDecrypted.mockResolvedValue('');

      const sut = makeSut();
      await expect(sut.askQuestion('shop.myshopify.com', 'hello')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('throws ServiceUnavailableException when user_id is empty', async () => {
      mockConfigGet.mockImplementation((_shopId: string, path: string) => {
        if (path === 'lokte.general.enable') return Promise.resolve(1);
        return Promise.resolve('');
      });
      mockConfigGetDecrypted.mockResolvedValue('token');

      const sut = makeSut();
      await expect(sut.askQuestion('shop.myshopify.com', 'hello')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('askQuestion — Lokte API calls', () => {
    beforeEach(() => setupHappyConfig());

    it('returns answer and empty documents on success', async () => {
      const ndjson = [
        JSON.stringify({ obj: { type: 'message_delta', content: 'The answer is 42' } }),
      ].join('\n');

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 'sess-1' }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(ndjson),
        } as unknown as Response);

      const sut = makeSut();
      const result = await sut.askQuestion('shop.myshopify.com', 'What is the answer?');
      expect(result.answer).toBe('The answer is 42');
      expect(result.documents).toEqual([]);
    });

    it('joins message_delta pieces into answer', async () => {
      const ndjson = [
        JSON.stringify({ obj: { type: 'message_delta', content: 'Hello' } }),
        JSON.stringify({ obj: { type: 'message_delta', content: ' world' } }),
      ].join('\n');

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 'sess-2' }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(ndjson),
        } as unknown as Response);

      const sut = makeSut();
      const result = await sut.askQuestion('shop.myshopify.com', 'Hi?');
      expect(result.answer).toBe('Hello world');
    });

    it('extracts documents from docs_snapshot event (wrapped obj format)', async () => {
      const ndjson = [
        JSON.stringify({
          obj: {
            type: 'docs_snapshot',
            top_documents: [
              {
                link: 'https://company.atlassian.net/wiki/page1',
                semantic_identifier: 'Page Title',
                source_type: 'confluence',
                blurb: 'Short excerpt about this page.',
                updated_at: '2025-10-01T00:00:00Z',
              },
            ],
          },
        }),
        JSON.stringify({ obj: { type: 'message_delta', content: 'Answer with link.' } }),
      ].join('\n');

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 'sess-3' }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(ndjson),
        } as unknown as Response);

      const sut = makeSut();
      const result = await sut.askQuestion('shop.myshopify.com', 'Find docs');
      expect(result.answer).toBe('Answer with link.');
      expect(result.documents).toHaveLength(1);
      expect(result.documents[0]).toMatchObject({
        title: 'Page Title',
        link: 'https://company.atlassian.net/wiki/page1',
        source_type: 'confluence',
        blurb: 'Short excerpt about this page.',
      });
    });

    it('extracts documents from flat top_documents event (Danswer/Onyx format)', async () => {
      const ndjson = [
        JSON.stringify({
          top_documents: [
            {
              link: 'https://app.slack.com/archives/C123/p456',
              semantic_identifier: 'Slack message title',
              source_type: 'slack',
              blurb: 'Slack excerpt.',
              updated_at: 1727740800,
            },
          ],
        }),
        JSON.stringify({ answer_piece: 'Flat answer.' }),
      ].join('\n');

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 'sess-5' }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(ndjson),
        } as unknown as Response);

      const sut = makeSut();
      const result = await sut.askQuestion('shop.myshopify.com', 'Slack question');
      expect(result.answer).toBe('Flat answer.');
      expect(result.documents).toHaveLength(1);
      expect(result.documents[0]).toMatchObject({
        title: 'Slack message title',
        link: 'https://app.slack.com/archives/C123/p456',
        source_type: 'slack',
      });
    });

    it('throws BadGatewayException when create-chat-session returns non-ok status', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as unknown as Response);

      const sut = makeSut();
      await expect(sut.askQuestion('shop.myshopify.com', 'hello')).rejects.toThrow(
        BadGatewayException,
      );
    });

    it('throws BadGatewayException when send-message returns non-ok status', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 'sess-4' }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        } as unknown as Response);

      const sut = makeSut();
      await expect(sut.askQuestion('shop.myshopify.com', 'hello')).rejects.toThrow(
        BadGatewayException,
      );
    });

    it('throws BadGatewayException when create-chat-session throws a network error', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const sut = makeSut();
      await expect(sut.askQuestion('shop.myshopify.com', 'hello')).rejects.toThrow(
        BadGatewayException,
      );
    });

    it('throws BadGatewayException when create-chat-session returns no session id', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as unknown as Response);

      const sut = makeSut();
      await expect(sut.askQuestion('shop.myshopify.com', 'hello')).rejects.toThrow(
        BadGatewayException,
      );
    });
  });
});
