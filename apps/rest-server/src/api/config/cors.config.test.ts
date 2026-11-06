import { describe, expect, it } from 'bun:test';
import axios from 'axios';
import { API_PREFIX } from '#api/rest.config.js';
import { Env } from '#env/index.js';

describe('CORS', () => {
  const url = `http://127.0.0.1:${Env.PORT}${API_PREFIX}/quests`;

  it('should allow a configured origin', async () => {
    const [origin] = Env.CORS_ORIGINS;
    const response = await axios.get(url, { headers: { Origin: origin }, validateStatus: () => true });

    expect(response.headers['access-control-allow-origin']).toBe(origin);
  });

  it('should not allow an unknown origin', async () => {
    const response = await axios.get(url, { headers: { Origin: 'https://evil.example' }, validateStatus: () => true });

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allows PATCH preflight for the web app', async () => {
    const [origin] = Env.CORS_ORIGINS;
    const response = await axios.options(`${url}/q_123`, {
      headers: {
        Origin: origin,
        'Access-Control-Request-Method': 'PATCH',
        'Access-Control-Request-Headers': 'content-type',
      },
      validateStatus: () => true,
    });
    expect(response.headers['access-control-allow-origin']).toBe(origin);
    expect(response.headers['access-control-allow-methods']).toContain('PATCH');
  });
});
