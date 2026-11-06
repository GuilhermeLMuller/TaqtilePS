import { getPlayerProgress } from '@data/player/player.datasource';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePlayerProgress } from './use-player-progress.use-case';

vi.mock('@data/player/player.datasource', () => ({ getPlayerProgress: vi.fn() }));
const getProgress = vi.mocked(getPlayerProgress);
afterEach(() => vi.resetAllMocks());

describe('usePlayerProgress', () => {
  it('ignores an old response that arrives after a newer one', async () => {
    let resolveOld: (value: { totalXp: number; currentXp: number; level: number }) => void = () => {};
    getProgress
      .mockReturnValueOnce(
        new Promise(resolve => {
          resolveOld = resolve;
        }),
      )
      .mockResolvedValueOnce({ totalXp: 125, level: 2, currentXp: 25 });
    const { result } = renderHook(() => usePlayerProgress());
    act(() => {
      void result.current.refetch();
    });
    await waitFor(() => expect(result.current.progress?.level).toBe(2));
    await act(async () => {
      resolveOld({ totalXp: 0, level: 1, currentXp: 0 });
    });
    expect(result.current.progress).toEqual({ totalXp: 125, level: 2, currentXp: 25 });
  });
});
