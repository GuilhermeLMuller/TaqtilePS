import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { clearDatabase, QuestsSeed } from '@repo/db/test';
import { API_PREFIX } from '#api/rest.config.js';
import type { Quest, UpdateQuestInput } from '#domain/model/quests.model.js';
import { RequestMaker } from '#test/request-maker.test.js';

interface Progress {
  totalXp: number;
  level: number;
  currentXp: number;
}

describe('GET /player/progress', () => {
  let requests: RequestMaker<Progress>;
  let questRequests: RequestMaker<Quest, UpdateQuestInput>;
  const endpoint = `${API_PREFIX}/player/progress`;

  beforeEach(() => {
    requests = new RequestMaker();
    questRequests = new RequestMaker();
  });
  afterEach(async () => {
    await clearDatabase();
  });

  it('starts at level 1 with no XP and excludes incomplete and deleted quests', async () => {
    await QuestsSeed.insertMany([
      { status: 'open', difficulty: 'high' },
      { status: 'in_progress', difficulty: 'normal' },
      { status: 'resolved', difficulty: 'high', deletedAt: new Date() },
    ]);
    expect((await requests.get({ endpoint })).data).toEqual({ totalXp: 0, level: 1, currentXp: 0 });
  });

  it('levels up at exactly 100 XP and keeps overflow across multiple levels', async () => {
    await QuestsSeed.insertMany([
      { status: 'resolved', difficulty: 'high' },
      { status: 'resolved', difficulty: 'high' },
    ]);
    expect((await requests.get({ endpoint })).data).toEqual({ totalXp: 100, level: 2, currentXp: 0 });
    await QuestsSeed.insertMany([
      { status: 'resolved', difficulty: 'high' },
      { status: 'resolved', difficulty: 'high' },
      { status: 'resolved', difficulty: 'normal' },
      { status: 'resolved', difficulty: 'easy' },
    ]);
    expect((await requests.get({ endpoint })).data).toEqual({ totalXp: 235, level: 3, currentXp: 35 });
  });

  it('recalculates when quests are completed, edited, or reopened', async () => {
    const quest = await QuestsSeed.insert({ status: 'in_progress', difficulty: 'easy' });
    const questEndpoint = `${API_PREFIX}/quests/${quest.id}`;
    await questRequests.patch({ endpoint: questEndpoint, body: { status: 'resolved' } });
    expect((await requests.get({ endpoint })).data).toEqual({ totalXp: 10, level: 1, currentXp: 10 });
    await questRequests.patch({ endpoint: questEndpoint, body: { difficulty: 'high' } });
    expect((await requests.get({ endpoint })).data).toEqual({ totalXp: 50, level: 1, currentXp: 50 });
    await questRequests.patch({ endpoint: questEndpoint, body: { status: 'open' } });
    expect((await requests.get({ endpoint })).data).toEqual({ totalXp: 0, level: 1, currentXp: 0 });
  });

  it('counts completed quests beyond the board page size', async () => {
    await QuestsSeed.insertMany(Array.from({ length: 101 }, () => ({ status: 'resolved', difficulty: 'easy' })));
    expect((await requests.get({ endpoint })).data).toEqual({ totalXp: 1010, level: 11, currentXp: 10 });
  });
});
