import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { dbClient } from '@repo/db';
import { clearDatabase, QuestsSeed } from '@repo/db/test';
import { API_PREFIX } from '#api/rest.config.js';
import type { Quest, UpdateQuestInput } from '#domain/model/quests.model.js';
import { QuestErrors } from '#domain/quests/quests.error.js';
import { checkErrors } from '#test/checkers/checker.test.js';
import { RequestMaker } from '#test/request-maker.test.js';

describe('PATCH /quests/:id', () => {
  let requests: RequestMaker<Quest, UpdateQuestInput>;
  const endpoint = (id: string) => `${API_PREFIX}/quests/${id}`;

  beforeEach(() => {
    requests = new RequestMaker();
  });
  afterEach(async () => {
    await clearDatabase();
  });

  it.each([
    [{ title: 'Novo título' }],
    [{ description: 'Nova descrição' }],
    [{ difficulty: 'easy' as const }],
    [{ status: 'in_progress' as const }],
  ])('updates only the provided fields: %j', async input => {
    const original = await QuestsSeed.insert();
    const response = await requests.patch({ endpoint: endpoint(original.id), body: input });
    const stored = await dbClient.query.questTable.findFirst({ where: { id: original.id } });
    expect(stored).toMatchObject({
      title: original.title,
      description: original.description,
      difficulty: original.difficulty,
      status: original.status,
      ...input,
    });
    expect(response.data).toMatchObject(input);
    expect(response.data.xpReward).toBe('difficulty' in input && input.difficulty === 'easy' ? 10 : 25);
  });

  it('updates multiple fields, persists status and recalculates XP', async () => {
    const original = await QuestsSeed.insert();
    const input = { title: 'Atualizada', description: 'Nova', difficulty: 'high', status: 'resolved' } as const;
    const response = await requests.patch({ endpoint: endpoint(original.id), body: input });
    expect(response.data).toMatchObject({ ...input, xpReward: 50 });
    expect(await dbClient.query.questTable.findFirst({ where: { id: original.id } })).toMatchObject(input);
    const fetched = await requests.get({ endpoint: endpoint(original.id) });
    expect(fetched.data).toMatchObject({ ...input, xpReward: 50 });
  });

  it.each([
    {},
    { title: '  ' },
    { description: '' },
    { difficulty: 'invalid' },
    { status: 'invalid' },
    { id: 'q_other' },
  ])('rejects invalid input %j without changing the quest', async body => {
    const original = await QuestsSeed.insert();
    await requests.patch({ endpoint: endpoint(original.id), body: body as UpdateQuestInput, expectedStatus: 422 });
    expect(await dbClient.query.questTable.findFirst({ where: { id: original.id } })).toEqual(original);
  });

  it('returns 404 for missing or deleted quests', async () => {
    const deleted = await QuestsSeed.insert({ deletedAt: new Date() });
    for (const id of ['q_missing', deleted.id]) {
      const response = await requests.patch({
        endpoint: endpoint(id),
        body: { status: 'resolved' },
        expectedStatus: 404,
      });
      checkErrors(response, [QuestErrors.NotFound]);
    }
  });

  it('rejects invalid ids', async () => {
    await requests.patch({ endpoint: endpoint('bad-id'), body: { status: 'resolved' }, expectedStatus: 422 });
  });
});
