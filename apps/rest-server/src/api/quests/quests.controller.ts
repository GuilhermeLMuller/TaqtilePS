import { Elysia, status } from 'elysia';
import { ErrorsResponse } from '#api/common/common.payload.js';
import { CreateQuestUseCase } from '#domain/quests/create-quest.use-case.js';
import { GetQuestUseCase } from '#domain/quests/get-quest.use-case.js';
import { ListQuestsUseCase } from '#domain/quests/list-quests.use-case.js';
import { UpdateQuestUseCase } from '#domain/quests/update-quest.use-case.js';
import {
  QuestParams,
  QuestRequest,
  QuestResponse,
  QuestsQuery,
  QuestsResponse,
  UpdateQuestRequest,
} from './quests.payload.js';

export const QuestsController = new Elysia({ name: 'QuestsController', prefix: '/quests', tags: ['Quests'] })
  .model({ QuestResponse, QuestsResponse, ErrorsResponse })

  .get('', ({ query }) => ListQuestsUseCase.exec(query), {
    detail: { description: 'List quests, optionally filtered by status.' },
    query: QuestsQuery,
    response: { 200: 'QuestsResponse', 422: 'ErrorsResponse' },
  })

  .get('/:id', ({ params }) => GetQuestUseCase.exec(params.id), {
    detail: { description: 'Get a quest by id.' },
    params: QuestParams,
    response: { 200: 'QuestResponse', 404: 'ErrorsResponse', 422: 'ErrorsResponse' },
  })

  .patch('/:id', ({ params, body }) => UpdateQuestUseCase.exec(params.id, body), {
    detail: { description: 'Update a quest.' },
    params: QuestParams,
    body: UpdateQuestRequest,
    response: { 200: 'QuestResponse', 404: 'ErrorsResponse', 422: 'ErrorsResponse' },
  })

  .post(
    '',
    async ({ body }) => {
      return status(201, await CreateQuestUseCase.exec(body));
    },
    {
      detail: { description: 'Create a quest.' },
      body: QuestRequest,
      response: { 201: 'QuestResponse', 422: 'ErrorsResponse' },
    },
  );
