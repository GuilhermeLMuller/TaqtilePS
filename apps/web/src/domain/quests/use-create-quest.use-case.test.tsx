import { ApiError } from '@core/http/http-client';
import { createQuest } from '@data/quests/quests.datasource';
import type { Quest } from '@domain/model/quest.model';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useCreateQuest } from './use-create-quest.use-case';

vi.mock('@data/quests/quests.datasource', () => ({
  createQuest: vi.fn(),
}));

const createQuestMock = vi.mocked(createQuest);

const QUEST: Quest = {
  id: 'q_1',
  title: 'Enfrentar o dragão',
  description: 'Derrote a besta',
  status: 'open',
  difficulty: 'normal',
  xpReward: 25,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('useCreateQuest', () => {
  it('returns the created quest on success', async () => {
    createQuestMock.mockResolvedValue(QUEST);

    const { result } = renderHook(() => useCreateQuest());

    let created: Quest | null = null;
    await act(async () => {
      created = await result.current.createQuest({
        title: QUEST.title,
        description: QUEST.description,
        difficulty: QUEST.difficulty,
      });
    });

    expect(created).toEqual(QUEST);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('returns null and sets an ApiError when the datasource rejects', async () => {
    createQuestMock.mockRejectedValue(new ApiError('falhou'));

    const { result } = renderHook(() => useCreateQuest());

    let created: Quest | null = QUEST;
    await act(async () => {
      created = await result.current.createQuest({
        title: QUEST.title,
        description: QUEST.description,
        difficulty: QUEST.difficulty,
      });
    });

    expect(created).toBeNull();
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error?.message).toBe('falhou');
  });

  it('wraps a non-ApiError rejection in a generic ApiError', async () => {
    createQuestMock.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useCreateQuest());

    await act(async () => {
      await result.current.createQuest({
        title: QUEST.title,
        description: QUEST.description,
        difficulty: QUEST.difficulty,
      });
    });

    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error?.message).toBe('Falha ao publicar a missão');
  });
});
