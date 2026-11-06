import { NotFoundError } from '@repo/core/error';
import { QuestsDbDatasource } from '#data/quests/quests.db.datasource.js';
import type { Quest, UpdateQuestInput } from '#domain/model/quests.model.js';
import { QuestErrors } from './quests.error.js';
import { withXpReward } from './quests.utils.js';

export const UpdateQuestUseCase = {
  async exec(id: string, input: UpdateQuestInput): Promise<Quest> {
    const quest = await QuestsDbDatasource.update(id, input);
    if (!quest) {
      throw new NotFoundError(QuestErrors.NotFound);
    }
    return withXpReward(quest);
  },
};
