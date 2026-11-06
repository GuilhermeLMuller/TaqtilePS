import { afterAll, afterEach, beforeAll, describe, expect, it, mock, spyOn } from 'bun:test';
import { DatabaseIdGenerator, dbClient } from '@repo/db';
import { clearDatabase } from '@repo/db/test';
import { API_PREFIX } from '#api/rest.config.js';
import type { Quest, QuestInput } from '#domain/model/quests.model.js';
import { checkErrors } from '#test/checkers/checker.test.js';
import { checkQuest } from '#test/checkers/quests.checker.test.js';
import { ValidationError } from '#test/checkers/validation.error.test.js';
import { RequestMaker } from '#test/request-maker.test.js';

describe('POST /quests', () => {
  const endpoint = `${API_PREFIX}/quests`;
  const questId = 'q_123';
  const invalidDataMessage = 'Os dados enviados são inválidos. Por favor, reveja as informações.';

  let requestMaker: RequestMaker<Quest, QuestInput>;

  beforeAll(() => {
    requestMaker = new RequestMaker();
    spyOn(DatabaseIdGenerator, 'generate').mockReturnValue(questId);
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(() => {
    mock.restore();
  });

  it.each([
    ['easy', 10],
    ['normal', 25],
    ['high', 50],
  ] as const)('should persist %s difficulty and return %i XP', async (difficulty, xpReward) => {
    const body = { title: 'Login page is throwing 500', description: 'Users report a server error.', difficulty };
    const response = await requestMaker.post({ endpoint, body });

    const questDb = (await dbClient.query.questTable.findFirst({ where: { id: questId } }))!;
    checkQuest(response.data, questDb);
    expect(questDb).toEqual({
      id: questId,
      title: body.title,
      description: body.description,
      status: 'open',
      difficulty,
      internalId: expect.any(Number),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      deletedAt: null,
    });
    expect(response.data.difficulty).toBe(difficulty);
    expect(response.data.xpReward).toBe(xpReward);
  });

  it('should reject an invalid difficulty', async () => {
    const body = { title: 'Quest', description: 'desc', difficulty: 'impossible' } as any;
    await requestMaker.post({ endpoint, body, expectedStatus: 422 });
    expect(await dbClient.query.questTable.findFirst({ where: { id: questId } })).toBeUndefined();
  });

  it('should reject a missing difficulty', async () => {
    const body = { title: 'Quest', description: 'desc' } as any;
    await requestMaker.post({ endpoint, body, expectedStatus: 422 });
  });

  it('should give an error if title is missing', async () => {
    const body = { description: 'desc', difficulty: 'normal' } as any;
    const response = await requestMaker.post({ endpoint, body, expectedStatus: 422 });

    checkErrors(response, [
      { code: 'VAL_01', message: invalidDataMessage, details: [{ message: ValidationError.requiredString }] },
    ]);
  });

  it('should give an error if title is not a string', async () => {
    const body = { title: 12345, description: 'desc', difficulty: 'normal' } as any;
    const response = await requestMaker.post({ endpoint, body, expectedStatus: 422 });

    checkErrors(response, [
      {
        code: 'VAL_01',
        message: invalidDataMessage,
        details: [{ message: ValidationError.invalidStringType }],
      },
    ]);
  });

  it('should give an error if description is missing', async () => {
    const body = { title: 'Missing description', difficulty: 'normal' } as any;
    const response = await requestMaker.post({ endpoint, body, expectedStatus: 422 });

    checkErrors(response, [
      { code: 'VAL_01', message: invalidDataMessage, details: [{ message: ValidationError.requiredString }] },
    ]);
  });
});
