import { ApiError } from '@core/http/http-client';
import type { Quest } from '@domain/model/quest.model';
import { useCreateQuest } from '@domain/quests/use-create-quest.use-case';
import { useListQuests } from '@domain/quests/use-list-quests.use-case';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import QuestBoardPage from './quest-board.page';

vi.mock('@domain/quests/use-list-quests.use-case', () => ({
  useListQuests: vi.fn(),
}));

vi.mock('@domain/quests/use-create-quest.use-case', () => ({
  useCreateQuest: vi.fn(),
}));

const useListQuestsMock = vi.mocked(useListQuests);
const useCreateQuestMock = vi.mocked(useCreateQuest);

const OPEN_QUEST: Quest = {
  id: 'q_1',
  title: 'Enfrentar o dragão',
  description: 'Derrote a besta',
  status: 'open',
  difficulty: 'normal',
  xpReward: 25,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const refetch = vi.fn();
const createQuest = vi.fn();

beforeEach(() => {
  refetch.mockReset();
  createQuest.mockReset();
  useListQuestsMock.mockReturnValue({ quests: [OPEN_QUEST], isLoading: false, error: null, refetch });
  useCreateQuestMock.mockReturnValue({ createQuest, isLoading: false, error: null });
});

describe('QuestBoardPage', () => {
  it('shows the loading state while quests are being fetched', () => {
    useListQuestsMock.mockReturnValue({ quests: [], isLoading: true, error: null, refetch });

    render(<QuestBoardPage />);

    expect(screen.queryByText(OPEN_QUEST.title)).not.toBeInTheDocument();
  });

  it('keeps the board on screen while refetching', () => {
    useListQuestsMock.mockReturnValue({ quests: [OPEN_QUEST], isLoading: true, error: null, refetch });

    render(<QuestBoardPage />);

    expect(screen.getByText(OPEN_QUEST.title)).toBeInTheDocument();
  });

  it('shows the error state and retries on demand', async () => {
    const user = userEvent.setup();
    useListQuestsMock.mockReturnValue({
      quests: [],
      isLoading: false,
      error: new ApiError('Falha ao carregar as missões'),
      refetch,
    });

    render(<QuestBoardPage />);

    expect(screen.getByRole('alert')).toHaveTextContent('Falha ao carregar as missões');

    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('lists each quest under its status column', () => {
    render(<QuestBoardPage />);

    expect(screen.getByText(OPEN_QUEST.title)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pergaminhos Novos' })).toBeInTheDocument();
  });

  it('moves a quest to the next column when advanced, without calling the backend', async () => {
    const user = userEvent.setup();
    render(<QuestBoardPage />);

    await user.click(screen.getByRole('button', { name: 'Aceitar missão' }));

    expect(screen.getByRole('button', { name: 'Selar a vitória' })).toBeInTheDocument();
    expect(createQuest).not.toHaveBeenCalled();
  });

  it('creates a quest and refetches the board on success', async () => {
    const user = userEvent.setup();
    createQuest.mockResolvedValue({ ...OPEN_QUEST, id: 'q_2', title: 'Nova missão criada' });

    render(<QuestBoardPage />);

    await user.click(screen.getByRole('button', { name: 'Nova missão' }));
    await user.type(screen.getByLabelText('Título da missão'), 'Nova missão criada');
    await user.type(screen.getByLabelText('Descrição'), 'Descrição da missão');
    await user.click(screen.getByRole('button', { name: 'Fácil' }));
    await user.click(screen.getByRole('button', { name: 'Publicar missão' }));

    expect(createQuest).toHaveBeenCalledWith({
      title: 'Nova missão criada',
      description: 'Descrição da missão',
      difficulty: 'easy',
    });
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
