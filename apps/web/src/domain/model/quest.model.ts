export type QuestStatus = 'open' | 'in_progress' | 'resolved';
export type QuestDifficulty = 'easy' | 'normal' | 'high';

export interface Quest {
  id: string;
  title: string;
  description: string;
  status: QuestStatus;
  difficulty: QuestDifficulty;
  xpReward: number;
  createdAt: string;
}

export interface QuestInput {
  title: string;
  description: string;
  difficulty: QuestDifficulty;
}

export interface PageInfo {
  limit: number;
  offset: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface Paginated<T> {
  nodes: T[];
  count: number;
  pageInfo: PageInfo;
}
