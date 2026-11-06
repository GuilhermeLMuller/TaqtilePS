import type { Paginated } from '@repo/core/pagination';
import { type ZodType, z } from 'zod';
import { PageRequest, PaginatedResponse } from '#api/common/common.payload.js';
import { QUEST_DIFFICULTIES, QUEST_STATUSES, type Quest, type QuestInput } from '#domain/model/quests.model.js';
import type { ListQuestsInput } from '#domain/quests/list-quests.use-case.js';

export const QuestStatusEnum = z.enum(QUEST_STATUSES);
export const QuestDifficultyEnum = z.enum(QUEST_DIFFICULTIES);

export const QuestResponse = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    status: QuestStatusEnum,
    difficulty: QuestDifficultyEnum,
    xpReward: z.number().int().nonnegative(),
    createdAt: z.date(),
  })
  .meta({ id: 'QuestResponse' }) satisfies ZodType<Quest>;

export const QuestRequest = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  difficulty: QuestDifficultyEnum,
}) satisfies ZodType<QuestInput>;

export const QuestParams = z.object({
  id: z.string().startsWith('q_'),
});

export const QuestsQuery = PageRequest.safeExtend({
  status: QuestStatusEnum.optional(),
}) satisfies ZodType<ListQuestsInput>;

export const QuestsResponse = PaginatedResponse(QuestResponse).meta({ id: 'QuestsResponse' }) satisfies ZodType<
  Paginated<Quest>
>;
