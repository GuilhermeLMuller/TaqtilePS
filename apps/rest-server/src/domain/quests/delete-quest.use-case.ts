import { NotFoundError } from '@repo/core/error';
import { QuestsDbDatasource } from '#data/quests/quests.db.datasource.js';
import { QuestErrors } from './quests.error.js';

export const DeleteQuestUseCase = {
  async exec(id: string): Promise<void> {
    if (!(await QuestsDbDatasource.softDelete(id))) {
      throw new NotFoundError(QuestErrors.NotFound);
    }
  },
};
