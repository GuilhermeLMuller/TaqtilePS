import { apiRequest } from '@core/http/http-client';
import { z } from 'zod';

const playerProgressSchema = z.object({
  totalXp: z.number().int().nonnegative(),
  level: z.number().int().positive(),
  currentXp: z.number().int().min(0).max(99),
});

export type PlayerProgress = z.infer<typeof playerProgressSchema>;

export async function getPlayerProgress(signal?: AbortSignal): Promise<PlayerProgress> {
  const response = await apiRequest<unknown>('/player/progress', { signal });
  return playerProgressSchema.parse(response);
}
