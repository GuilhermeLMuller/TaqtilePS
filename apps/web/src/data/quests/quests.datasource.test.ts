import { afterEach, describe, expect, it, vi } from 'vitest';
import { createQuest, listQuests, updateQuest } from './quests.datasource';

const QUEST_RESPONSE = {
  id: 'q_1',
  title: 'Enfrentar o dragão',
  description: 'Derrote a besta',
  status: 'open',
  difficulty: 'normal',
  xpReward: 25,
  createdAt: '2026-01-01T00:00:00.000Z',
};

function mockFetchOnce(body: unknown) {
  const response = { ok: true, status: 200, json: async () => body } as Response;
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('updateQuest', () => {
  it('PATCHes the provided fields and validates the response', async () => {
    const updated = { ...QUEST_RESPONSE, status: 'resolved', difficulty: 'high', xpReward: 50 };
    mockFetchOnce(updated);
    expect(await updateQuest('q_1', { status: 'resolved', difficulty: 'high' })).toEqual(updated);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/quests\/q_1$/),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'resolved', difficulty: 'high' }),
      }),
    );
  });

  it('rejects an invalid response', async () => {
    mockFetchOnce({ ...QUEST_RESPONSE, difficulty: 'invalid' });
    await expect(updateQuest('q_1', { status: 'resolved' })).rejects.toThrow();
  });
});

describe('listQuests', () => {
  it('requests /quests with no query string when no params are given', async () => {
    mockFetchOnce({
      nodes: [QUEST_RESPONSE],
      count: 1,
      pageInfo: { limit: 10, offset: 0, hasNextPage: false, hasPreviousPage: false },
    });

    await listQuests();

    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/quests$/), expect.anything());
  });

  it('builds the query string from status/limit/offset', async () => {
    mockFetchOnce({
      nodes: [],
      count: 0,
      pageInfo: { limit: 5, offset: 10, hasNextPage: false, hasPreviousPage: false },
    });

    await listQuests({ status: 'open', limit: 5, offset: 10 });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/quests\?status=open&limit=5&offset=10$/),
      expect.anything(),
    );
  });

  it('throws when the response does not match the Quest schema', async () => {
    mockFetchOnce({
      nodes: [{ ...QUEST_RESPONSE, status: 'not-a-real-status' }],
      count: 1,
      pageInfo: { limit: 10, offset: 0, hasNextPage: false, hasPreviousPage: false },
    });

    await expect(listQuests()).rejects.toThrow();
  });
});

describe('createQuest', () => {
  it('POSTs the input as JSON and returns the parsed quest', async () => {
    mockFetchOnce(QUEST_RESPONSE);

    const result = await createQuest({
      title: 'Enfrentar o dragão',
      description: 'Derrote a besta',
      difficulty: 'high',
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/quests$/),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'Enfrentar o dragão', description: 'Derrote a besta', difficulty: 'high' }),
      }),
    );
    expect(result).toEqual(QUEST_RESPONSE);
  });
});
