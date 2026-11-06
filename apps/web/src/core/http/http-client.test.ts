import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest } from './http-client';

function mockFetch(response: Partial<Response>) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
}

async function rejectionOf(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    return error as ApiError;
  }
  throw new Error('Expected the request to fail');
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiRequest', () => {
  it('returns the parsed body on success', async () => {
    mockFetch({ ok: true, status: 200, json: async () => ({ id: 'q_1' }) });

    await expect(apiRequest('/quests/q_1')).resolves.toEqual({ id: 'q_1' });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/quests\/q_1$/),
      expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) }),
    );
  });

  it('returns undefined for a successful 204 response without parsing JSON', async () => {
    const json = vi.fn();
    mockFetch({ ok: true, status: 204, json });
    await expect(apiRequest<void>('/quests/q_1', { method: 'DELETE' })).resolves.toBeUndefined();
    expect(json).not.toHaveBeenCalled();
  });

  it('throws an ApiError keeping the original failure as cause when the server is unreachable', async () => {
    const networkError = new TypeError('Failed to fetch');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(networkError));

    const error = await rejectionOf(apiRequest('/quests'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('Não foi possível conectar ao servidor. Verifique sua conexão.');
    expect(error.cause).toBe(networkError);
  });

  it('rethrows an abort untouched instead of wrapping it in an ApiError', async () => {
    const controller = new AbortController();
    const abortError = new DOMException('The operation was aborted.', 'AbortError');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));
    controller.abort();

    const error = await rejectionOf(apiRequest('/quests', { signal: controller.signal }));

    expect(error).toBe(abortError);
  });

  it('throws the first API error with its message and code', async () => {
    mockFetch({
      ok: false,
      status: 404,
      json: async () => ({ errors: [{ code: 'QST_01', message: 'Missão não encontrada.' }] }),
    });

    const error = await rejectionOf(apiRequest('/quests/q_missing'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('Missão não encontrada.');
    expect(error.code).toBe('QST_01');
  });

  it('falls back to a status message when the error body is not JSON', async () => {
    mockFetch({
      ok: false,
      status: 502,
      json: async () => {
        throw new SyntaxError('Unexpected token <');
      },
    });

    const error = await rejectionOf(apiRequest('/quests'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('A requisição falhou (status 502).');
    expect(error.code).toBeUndefined();
  });

  it('falls back to a status message when the error body has no errors', async () => {
    mockFetch({ ok: false, status: 500, json: async () => ({}) });

    const error = await rejectionOf(apiRequest('/quests'));

    expect(error.message).toBe('A requisição falhou (status 500).');
  });
});
