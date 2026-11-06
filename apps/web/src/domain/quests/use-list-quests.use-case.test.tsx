import { ApiError } from '@core/http/http-client';
import { listQuests } from '@data/quests/quests.datasource';
import type { Quest } from '@domain/model/quest.model';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useListQuests } from './use-list-quests.use-case';

vi.mock('@data/quests/quests.datasource', () => ({
  listQuests: vi.fn(),
}));

const listQuestsMock = vi.mocked(listQuests);

const QUEST: Quest = {
  id: 'q_1',
  title: 'Enfrentar o dragão',
  description: 'Derrote a besta',
  status: 'open',
  difficulty: 'normal',
  xpReward: 25,
  createdAt: '2026-01-01T00:00:00.000Z',
};

afterEach(() => {
  vi.resetAllMocks();
});

describe('useListQuests', () => {
  it('loads quests on mount', async () => {
    listQuestsMock.mockResolvedValue({
      nodes: [QUEST],
      count: 1,
      pageInfo: { limit: 100, offset: 0, hasNextPage: false, hasPreviousPage: false },
    });

    const { result } = renderHook(() => useListQuests());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.quests).toEqual([QUEST]);
    expect(result.current.error).toBeNull();
  });

  it('sets the ApiError the datasource rejected with', async () => {
    listQuestsMock.mockRejectedValue(new ApiError('deu ruim'));

    const { result } = renderHook(() => useListQuests());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error?.message).toBe('deu ruim');
    expect(result.current.quests).toEqual([]);
  });

  it('wraps a non-ApiError rejection in a generic ApiError', async () => {
    listQuestsMock.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useListQuests());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error?.message).toBe('Falha ao carregar as missões');
  });

  it('refetch reloads the quests', async () => {
    listQuestsMock.mockResolvedValue({
      nodes: [],
      count: 0,
      pageInfo: { limit: 100, offset: 0, hasNextPage: false, hasPreviousPage: false },
    });

    const { result } = renderHook(() => useListQuests());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    listQuestsMock.mockClear();

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(listQuestsMock).toHaveBeenCalledTimes(1));
  });

  it('replaces a saved quest and ignores a stale in-flight list response', async () => {
    const page = (nodes: Quest[]) => ({
      nodes,
      count: nodes.length,
      pageInfo: { limit: 100, offset: 0, hasNextPage: false, hasPreviousPage: false },
    });
    let resolveStale: (value: ReturnType<typeof page>) => void = () => {};
    const updated = { ...QUEST, status: 'resolved' as const };
    listQuestsMock
      .mockResolvedValueOnce(page([QUEST]))
      .mockReturnValueOnce(
        new Promise(resolve => {
          resolveStale = resolve;
        }),
      )
      .mockResolvedValueOnce(page([updated]));
    const { result } = renderHook(() => useListQuests());
    await waitFor(() => expect(result.current.quests).toEqual([QUEST]));
    act(() => {
      result.current.refetch();
    });
    act(() => {
      result.current.replaceQuest(updated);
    });
    await act(async () => {
      resolveStale(page([QUEST]));
    });
    await waitFor(() => expect(result.current.quests).toEqual([updated]));
    expect(listQuestsMock).toHaveBeenCalledTimes(3);
  });

  it('ignores a stale response that resolves after a newer one', async () => {
    const page = (nodes: Quest[]) => ({
      nodes,
      count: nodes.length,
      pageInfo: { limit: 100, offset: 0, hasNextPage: false, hasPreviousPage: false },
    });
    let resolveFirst: (value: ReturnType<typeof page>) => void = () => {};
    listQuestsMock
      .mockReturnValueOnce(new Promise(resolve => (resolveFirst = resolve)))
      .mockResolvedValueOnce(page([{ ...QUEST, id: 'q_new', title: 'Nova' }]));

    const { result } = renderHook(() => useListQuests());
    act(() => {
      result.current.refetch();
    });
    await waitFor(() => expect(result.current.quests).toHaveLength(1));

    await act(async () => resolveFirst(page([QUEST])));

    expect(result.current.quests.map(quest => quest.id)).toEqual(['q_new']);
    expect(result.current.isLoading).toBe(false);
  });

  it('removes a quest and prevents an older list response from restoring it', async () => {
    const page = (nodes: Quest[]) => ({
      nodes,
      count: nodes.length,
      pageInfo: { limit: 100, offset: 0, hasNextPage: false, hasPreviousPage: false },
    });
    let resolveStale: (value: ReturnType<typeof page>) => void = () => {};
    listQuestsMock
      .mockResolvedValueOnce(page([QUEST]))
      .mockReturnValueOnce(
        new Promise(resolve => {
          resolveStale = resolve;
        }),
      )
      .mockResolvedValueOnce(page([]));
    const { result } = renderHook(() => useListQuests());
    await waitFor(() => expect(result.current.quests).toEqual([QUEST]));
    act(() => {
      result.current.refetch();
    });
    act(() => {
      result.current.removeQuest(QUEST.id);
    });
    await act(async () => {
      resolveStale(page([QUEST]));
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.quests).toEqual([]);
  });

  it('aborts the pending request on unmount', () => {
    listQuestsMock.mockReturnValue(new Promise(() => {}));

    const { unmount } = renderHook(() => useListQuests());
    const signal = listQuestsMock.mock.calls[0]![1]!;
    unmount();

    expect(signal.aborted).toBe(true);
  });
});
