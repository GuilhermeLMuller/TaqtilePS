import { Elysia } from 'elysia';
import { z } from 'zod';
import { GetPlayerProgressUseCase } from '#domain/player/get-player-progress.use-case.js';

const PlayerProgressResponse = z.object({
  totalXp: z.number().int().nonnegative(),
  level: z.number().int().positive(),
  currentXp: z.number().int().min(0).max(99),
});

export const PlayerController = new Elysia({ name: 'PlayerController', prefix: '/player', tags: ['Player'] }).get(
  '/progress',
  () => GetPlayerProgressUseCase.exec(),
  {
    detail: { description: 'Get player progress from completed quests.' },
    response: { 200: PlayerProgressResponse },
  },
);
