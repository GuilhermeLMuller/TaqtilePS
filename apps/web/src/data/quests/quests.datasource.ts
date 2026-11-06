import { apiRequest } from '@core/http/http-client';
import type { Paginated, Quest, QuestInput, QuestStatus, UpdateQuestInput } from '@domain/model/quest.model';
import { paginatedQuestSchema, questSchema } from './quest.schema';

interface ListQuestsParams {
  status?: QuestStatus;
  limit?: number;
  offset?: number;
}

export async function listQuests(params: ListQuestsParams = {}, signal?: AbortSignal): Promise<Paginated<Quest>> {
  const query = new URLSearchParams();
  if (params.status) {
    query.set('status', params.status);
  }
  if (params.limit != null) {
    query.set('limit', String(params.limit));
  }
  if (params.offset != null) {
    query.set('offset', String(params.offset));
  }

  const queryString = query.toString();
  const response = await apiRequest<unknown>(`/quests${queryString ? `?${queryString}` : ''}`, { signal });
  return paginatedQuestSchema.parse(response);
}

export async function createQuest(input: QuestInput): Promise<Quest> {
  const response = await apiRequest<unknown>('/quests', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return questSchema.parse(response);
}

export async function updateQuest(id: string, input: UpdateQuestInput): Promise<Quest> {
  const response = await apiRequest<unknown>(`/quests/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return questSchema.parse(response);
}

export async function deleteQuest(id: string): Promise<void> {
  await apiRequest<void>(`/quests/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
