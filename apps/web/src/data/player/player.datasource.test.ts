import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPlayerProgress } from './player.datasource';

afterEach(() => vi.unstubAllGlobals());

describe('getPlayerProgress', () => {
  it('fetches and validates progress', async () => {
    const progress = { totalXp: 125, level: 2, currentXp: 25 };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => progress }));
    expect(await getPlayerProgress()).toEqual(progress);
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/player\/progress$/), expect.anything());
  });

  it('rejects invalid progress from the server', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue({ ok: true, status: 200, json: async () => ({ totalXp: 100, level: 2, currentXp: 100 }) }),
    );
    await expect(getPlayerProgress()).rejects.toThrow();
  });
});
