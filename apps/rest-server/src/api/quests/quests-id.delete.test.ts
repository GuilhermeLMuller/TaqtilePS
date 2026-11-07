import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { dbClient } from '@repo/db';
import { clearDatabase, QuestsSeed } from '@repo/db/test';
import { API_PREFIX } from '#api/rest.config.js';
import type { Quest, UpdateQuestInput } from '#domain/model/quests.model.js';
import { QuestErrors } from '#domain/quests/quests.error.js';
import { checkErrors } from '#test/checkers/checker.test.js';
import { RequestMaker } from '#test/request-maker.test.js';

describe('DELETE /quests/:id', () => {
  let requests: RequestMaker<Quest, UpdateQuestInput>;
  const endpoint = (id: string) => `${API_PREFIX}/quests/${id}`;
  beforeEach(() => {
    requests = new RequestMaker();
  });
  afterEach(async () => {
    await clearDatabase();
  });

  it('soft deletes a completed quest, hides it and recalculates player XP', async () => {
    const quest = await QuestsSeed.insert({ status: 'resolved', difficulty: 'high' });
    await requests.delete({ endpoint: endpoint(quest.id), expectedStatus: 204 });
    const stored = await dbClient.query.questTable.findFirst({ where: { id: quest.id } });
    expect(stored).toMatchObject({ id: quest.id, title: quest.title, deletedAt: expect.any(Date) });
    await requests.get({ endpoint: endpoint(quest.id), expectedStatus: 404 });
    await requests.patch({ endpoint: endpoint(quest.id), body: { title: 'Nova' }, expectedStatus: 404 });
    const list = await new RequestMaker<{ nodes: Quest[]; count: number }>().get({ endpoint: `${API_PREFIX}/quests` });
    expect(list.data.nodes).toHaveLength(0);
    expect(list.data.count).toBe(0);
    const progress = await new RequestMaker<{ totalXp: number; level: number; currentXp: number }>().get({
      endpoint: `${API_PREFIX}/player/progress`,
    });
    expect(progress.data).toEqual({ totalXp: 0, level: 1, currentXp: 0 });
  });

  it('returns 404 for missing and already deleted quests without changing the deletion date', async () => {
    const deletedAt = new Date('2026-01-01T00:00:00Z');
    const deleted = await QuestsSeed.insert({ deletedAt });
    for (const id of ['q_missing', deleted.id]) {
      const response = await requests.delete({ endpoint: endpoint(id), expectedStatus: 404 });
      checkErrors(response, [QuestErrors.NotFound]);
    }
    expect((await dbClient.query.questTable.findFirst({ where: { id: deleted.id } }))?.deletedAt).toEqual(deletedAt);
  });

  it('rejects invalid quest ids', async () => {
    await requests.delete({ endpoint: endpoint('invalid'), expectedStatus: 422 });
  });
});
