import type { PageInput, Paginated } from '@repo/core/pagination';
import { buildPageInfo } from '@repo/core/pagination';
import { DatabaseIdGenerator, dbClient, type QuestEntity, questTable } from '@repo/db';
import { and, count, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import {
  QUEST_DIFFICULTIES,
  QUEST_STATUSES,
  type QuestData,
  type QuestInput,
  type QuestStatus,
  type UpdateQuestInput,
} from '#domain/model/quests.model.js';

const EXTERNAL_ID_PREFIX = 'q_';

// The columns are plain varchar, so values are checked here instead of trusting a cast.
const StatusColumn = z.enum(QUEST_STATUSES);
const DifficultyColumn = z.enum(QUEST_DIFFICULTIES);

export const QuestsDbDatasource = {
  async countCompletedByDifficulty() {
    const rows = await dbClient
      .select({ difficulty: questTable.difficulty, count: count() })
      .from(questTable)
      .where(and(eq(questTable.status, 'resolved'), isNull(questTable.deletedAt)))
      .groupBy(questTable.difficulty);

    return rows.map(row => ({ difficulty: DifficultyColumn.parse(row.difficulty), count: row.count }));
  },

  async update(id: string, input: UpdateQuestInput): Promise<QuestData | null> {
    const [quest] = await dbClient
      .update(questTable)
      .set(input)
      .where(and(eq(questTable.id, id), isNull(questTable.deletedAt)))
      .returning();
    return quest ? toQuestData(quest) : null;
  },

  async create(input: QuestInput): Promise<QuestData> {
    const id = DatabaseIdGenerator.generate(EXTERNAL_ID_PREFIX);
    const createdAt = new Date(Date.now() + 3 * 60 * 60 * 1000);

    const [quest] = await dbClient
      .insert(questTable)
      .values({ ...input, id, createdAt })
      .returning();

    return toQuestData(quest!);
  },

  async findOneById(id: string): Promise<QuestData | null> {
    const quest = await dbClient.query.questTable.findFirst({ where: { id, deletedAt: { isNull: true } } });
    return quest ? toQuestData(quest) : null;
  },

  async findMany(status: QuestStatus | undefined, page: PageInput): Promise<Paginated<QuestData>> {
    const offset = page.offset ?? 0;

    const [nodes, totalItems] = await Promise.all([
      dbClient.query.questTable.findMany({
        where: status ? { status, deletedAt: { isNull: true } } : { deletedAt: { isNull: true } },
        orderBy: { createdAt: 'desc' },
        limit: page.limit,
        offset,
      }),
      countActiveQuests(status),
    ]);

    return { nodes: nodes.map(toQuestData), count: totalItems, pageInfo: buildPageInfo(page, totalItems) };
  },
};

function toQuestData(entity: QuestEntity): QuestData {
  return {
    id: entity.id,
    title: entity.title,
    description: entity.description,
    status: StatusColumn.parse(entity.status),
    difficulty: DifficultyColumn.parse(entity.difficulty),
    createdAt: entity.createdAt,
  };
}

async function countActiveQuests(status?: QuestStatus): Promise<number> {
  const activeFilter = isNull(questTable.deletedAt);
  const where = status ? and(activeFilter, eq(questTable.status, status)) : activeFilter;

  const [row] = await dbClient.select({ value: count() }).from(questTable).where(where);
  return row!.value;
}
