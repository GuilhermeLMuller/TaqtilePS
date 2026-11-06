import { QuestsDbDatasource } from '#data/quests/quests.db.datasource.js';
import { calculateXpReward } from '#domain/quests/quests.utils.js';

export const GetPlayerProgressUseCase = {
  async exec() {
    const completed = await QuestsDbDatasource.countCompletedByDifficulty();
    const totalXp = completed.reduce((total, entry) => total + calculateXpReward(entry.difficulty) * entry.count, 0);
    return { totalXp, level: 1 + Math.floor(totalXp / 100), currentXp: totalXp % 100 };
  },
};
