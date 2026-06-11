import { BadGatewayException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { LokteService } from './lokte.service';
import { ConfigRegistryService } from '../config-registry/config-registry.service';

const mockConfigGet = jest.fn();
const mockConfigGetDecrypted = jest.fn();

const mockConfigRegistry = {
  get: mockConfigGet,
  getDecrypted: mockConfigGetDecrypted,
} as unknown as ConfigRegistryService;

const mockMessageSave = jest.fn();
const mockMessageCreate = jest.fn((data: object) => data);
const mockMessageCount = jest.fn();
const mockMessageFind = jest.fn();
const mockMessageDelete = jest.fn();

const mockMessageRepo = {
  save: mockMessageSave,
  create: mockMessageCreate,
  count: mockMessageCount,
  find: mockMessageFind,
  delete: mockMessageDelete,
} as unknown as import('typeorm').Repository<import('./entities/chat-message.entity').ChatMessage>;

const mockSessionFindOne = jest.fn();
const mockSessionFind = jest.fn();
const mockSessionSave = jest.fn();
const mockSessionCreate = jest.fn((data: object) => data);
const mockSessionUpdate = jest.fn();
const mockSessionDelete = jest.fn();

const mockSessionRepo = {
  findOne: mockSessionFindOne,
  find: mockSessionFind,
  save: mockSessionSave,
  create: mockSessionCreate,
  update: mockSessionUpdate,
  delete: mockSessionDelete,
} as unknown as import('typeorm').Repository<import('./entities/chat-session.entity').ChatSession>;

const mockFaqPoolSave = jest.fn();
const mockFaqPoolCreate = jest.fn((data: object) => data);

const mockFaqPoolRepo = {
  save: mockFaqPoolSave,
  create: mockFaqPoolCreate,
} as unknown as import('typeorm').Repository<import('../faq-suggestions/entities/faq-question-pool.entity').FaqQuestionPool>;

function makeSut() {
  return new LokteService(mockConfigRegistry, mockMessageRepo, mockSessionRepo, mockFaqPoolRepo);
}

function setupHappyConfig() {
  mockConfigGet.mockImplementation((_shopId: string, path: string) => {
    if (path === 'lokte.general.enable') return Promise.resolve(1);
    if (path === 'lokte.general.user_id') return Promise.resolve('238');
    return Promise.resolve(undefined);
  });
  mockConfigGetDecrypted.mockResolvedValue('test-token');
}

function setupHappyRepos() {
  // No pre-existing session → exercises createSession (DB save, no Lokte call yet)
  // then ensureLokteSession triggers createLokteSession (first fetch).
  // lokteSessionId: null so ensureLokteSession performs the lazy Lokte session init.
  mockSessionFindOne.mockResolvedValue(null);
  mockSessionCreate.mockImplementation((data: object) => data);
  mockSessionSave.mockImplementation((entity: object) =>
    Promise.resolve({ id: 'sess-db-1', lokteSessionId: null, lastAssistantMsgId: null, title: '', ...entity }),
  );
  mockSessionUpdate.mockResolvedValue(undefined);
  mockMessageSave.mockResolvedValue(undefined);
  mockMessageCount.mockResolvedValue(1);
  // FAQ pool logging is non-fatal; resolve by default
  mockFaqPoolSave.mockResolvedValue(undefined);
  mockFaqPoolCreate.mockImplementation((data: object) => data);
}

describe('LokteService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('askQuestion — config guards', () => {
    it('throws ServiceUnavailableException when lokte is disabled', async () => {
      mockConfigGet.mockResolvedValue(0);
      mockConfigGetDecrypted.mockResolvedValue('');

      const sut = makeSut();
      await expect(sut.askQuestion('shop.myshopify.com', 'user-id', 'hello')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('throws ServiceUnavailableException when api_key is empty', async () => {
      mockConfigGet.mockImplementation((_shopId: string, path: string) =>
        Promise.resolve(path === 'lokte.general.enable' ? 1 : undefined),
      );
      mockConfigGetDecrypted.mockResolvedValue('');

      const sut = makeSut();
      await expect(sut.askQuestion('shop.myshopify.com', 'user-id', 'hello')).rejects.toThrow(
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
      await expect(sut.askQuestion('shop.myshopify.com', 'user-id', 'hello')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('askQuestion — Lokte API calls', () => {
    beforeEach(() => { setupHappyConfig(); setupHappyRepos(); });

    it('returns answer, empty documents, and chatId on success', async () => {
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
      const result = await sut.askQuestion('shop.myshopify.com', 'user-id', 'What is the answer?');
      expect(result.answer).toBe('The answer is 42');
      expect(result.documents).toEqual([]);
      expect(result.chatId).toBe('sess-db-1');
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
      const result = await sut.askQuestion('shop.myshopify.com', 'user-id', 'Hi?');
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
      const result = await sut.askQuestion('shop.myshopify.com', 'user-id', 'Find docs');
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
      const result = await sut.askQuestion('shop.myshopify.com', 'user-id', 'Slack question');
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
      await expect(sut.askQuestion('shop.myshopify.com', 'user-id', 'hello')).rejects.toThrow(
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
      await expect(sut.askQuestion('shop.myshopify.com', 'user-id', 'hello')).rejects.toThrow(
        BadGatewayException,
      );
    });

    it('throws BadGatewayException when create-chat-session throws a network error', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const sut = makeSut();
      await expect(sut.askQuestion('shop.myshopify.com', 'user-id', 'hello')).rejects.toThrow(
        BadGatewayException,
      );
    });

    it('throws BadGatewayException when create-chat-session returns no session id', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as unknown as Response);

      const sut = makeSut();
      await expect(sut.askQuestion('shop.myshopify.com', 'user-id', 'hello')).rejects.toThrow(
        BadGatewayException,
      );
    });

    it('reuses existing chatId and skips create-chat-session when lokteSessionId already set', async () => {
      const existingSession = {
        id: 'sess-db-existing',
        shopId: 'shop.myshopify.com',
        userId: 'user-id',
        lokteSessionId: 'lokte-existing',
        lastAssistantMsgId: 42,
        title: 'Existing chat',
      };
      mockSessionFindOne.mockResolvedValue(existingSession);

      const ndjson = JSON.stringify({ obj: { type: 'message_delta', content: 'Reused answer' } });
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(ndjson),
      } as unknown as Response);

      const sut = makeSut();
      const result = await sut.askQuestion('shop.myshopify.com', 'user-id', 'follow-up?', 'sess-db-existing');
      expect(result.answer).toBe('Reused answer');
      expect(result.chatId).toBe('sess-db-existing');
      // Only 1 fetch (send-message), no create-chat-session
      expect(global.fetch as jest.Mock).toHaveBeenCalledTimes(1);
    });

    it('throws NotFoundException when chatId is provided but does not belong to user', async () => {
      mockSessionFindOne.mockResolvedValue(null); // session not found for this user

      const sut = makeSut();
      await expect(
        sut.askQuestion('shop.myshopify.com', 'user-id', 'hello', 'unknown-chat-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('persistMessages — message ordering', () => {
    beforeEach(() => { setupHappyConfig(); setupHappyRepos(); });

    it('saves user message strictly before assistant message (separate save calls)', async () => {
      const ndjson = JSON.stringify({ obj: { type: 'message_delta', content: 'The answer' } });

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 'lokte-sess-1' }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(ndjson),
        } as unknown as Response);

      const saveOrder: string[] = [];
      mockMessageSave.mockImplementation((entity: { role?: string }) => {
        if (entity?.role) saveOrder.push(entity.role);
        return Promise.resolve(entity);
      });

      const sut = makeSut();
      await sut.askQuestion('shop.myshopify.com', 'user-id', 'What is the answer?');

      expect(mockMessageSave).toHaveBeenCalledTimes(2);
      expect(saveOrder).toEqual(['user', 'assistant']);
    });
  });

  describe('listChats', () => {
    it('returns sessions ordered newest first', async () => {
      const sessions = [
        { id: 'c1', title: 'Chat A', createdAt: new Date('2025-01-02'), updatedAt: new Date('2025-01-03') },
        { id: 'c2', title: 'Chat B', createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
      ];
      mockSessionFind.mockResolvedValue(sessions);

      const sut = makeSut();
      const result = await sut.listChats('shop.myshopify.com', 'user-id');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('c1');
    });
  });

  describe('deleteChat', () => {
    it('throws NotFoundException when chatId does not belong to user', async () => {
      mockSessionFindOne.mockResolvedValue(null);
      const sut = makeSut();
      await expect(sut.deleteChat('shop.myshopify.com', 'user-id', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deletes the session (FK cascade removes messages)', async () => {
      mockSessionFindOne.mockResolvedValue({
        id: 'sess-1',
        lokteSessionId: 'lokte-1',
        shopId: 'shop.myshopify.com',
        userId: 'user-id',
      });
      mockConfigGetDecrypted.mockResolvedValue('token');
      global.fetch = jest.fn().mockResolvedValueOnce({ ok: true } as unknown as Response);
      mockSessionDelete.mockResolvedValue(undefined);

      const sut = makeSut();
      await sut.deleteChat('shop.myshopify.com', 'user-id', 'sess-1');
      expect(mockSessionDelete).toHaveBeenCalledWith('sess-1');
    });
  });
});

