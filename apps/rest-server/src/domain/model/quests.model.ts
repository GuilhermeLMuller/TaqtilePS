export const QUEST_STATUSES = ['open', 'in_progress', 'resolved'] as const;
export const QUEST_DIFFICULTIES = ['easy', 'normal', 'high'] as const;

export type QuestStatus = (typeof QUEST_STATUSES)[number];
export type QuestDifficulty = (typeof QUEST_DIFFICULTIES)[number];

export interface Quest {
  id: string;
  title: string;
  description: string;
  status: QuestStatus;
  difficulty: QuestDifficulty;
  xpReward: number;
  createdAt: Date;
}

export type QuestData = Omit<Quest, 'xpReward'>;

export interface QuestInput {
  title: string;
  description: string;
  difficulty: QuestDifficulty;
}

export type UpdateQuestInput = Partial<QuestInput & Pick<Quest, 'status'>>;
