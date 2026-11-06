import { ApiError } from '@core/http/http-client';
import { updateQuest } from '@data/quests/quests.datasource';
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
vi.mock('@data/quests/quests.datasource', () => ({ updateQuest: vi.fn() }));

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
const replaceQuest = vi.fn();
const updateQuestMock = vi.mocked(updateQuest);

beforeEach(() => {
  refetch.mockReset();
  createQuest.mockReset();
  replaceQuest.mockReset();
  updateQuestMock.mockReset();
  useListQuestsMock.mockReturnValue({ quests: [OPEN_QUEST], isLoading: false, error: null, refetch, replaceQuest });
  useCreateQuestMock.mockReturnValue({ createQuest, isLoading: false, error: null });
});

describe('QuestBoardPage', () => {
  it('shows the loading state while quests are being fetched', () => {
    useListQuestsMock.mockReturnValue({ quests: [], isLoading: true, error: null, refetch, replaceQuest });

    render(<QuestBoardPage />);

    expect(screen.queryByText(OPEN_QUEST.title)).not.toBeInTheDocument();
  });

  it('keeps the board on screen while refetching', () => {
    useListQuestsMock.mockReturnValue({ quests: [OPEN_QUEST], isLoading: true, error: null, refetch, replaceQuest });

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
      replaceQuest,
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

  it('persists advancement and updates the board from the response', async () => {
    const user = userEvent.setup();
    const updated = { ...OPEN_QUEST, status: 'in_progress' as const };
    updateQuestMock.mockResolvedValue(updated);
    const { rerender } = render(<QuestBoardPage />);

    await user.click(screen.getByRole('button', { name: 'Aceitar missão' }));

    expect(updateQuestMock).toHaveBeenCalledWith('q_1', { status: 'in_progress' });
    expect(replaceQuest).toHaveBeenCalledWith(updated);
    useListQuestsMock.mockReturnValue({ quests: [updated], isLoading: false, error: null, refetch, replaceQuest });
    rerender(<QuestBoardPage />);
    expect(screen.getByRole('button', { name: 'Selar a vitória' })).toBeInTheDocument();
  });

  it('shows an error and keeps the quest in its column when advancement fails', async () => {
    const user = userEvent.setup();
    updateQuestMock.mockRejectedValue(new ApiError('Não foi possível salvar'));
    render(<QuestBoardPage />);
    await user.click(screen.getByRole('button', { name: 'Aceitar missão' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível salvar');
    expect(screen.getByRole('button', { name: 'Aceitar missão' })).toBeInTheDocument();
    expect(replaceQuest).not.toHaveBeenCalled();
  });

  it('edits all fields including status and uses the saved quest', async () => {
    const user = userEvent.setup();
    const updated: Quest = {
      ...OPEN_QUEST,
      title: 'Nova',
      description: 'Alterada',
      difficulty: 'high',
      status: 'resolved',
      xpReward: 50,
    };
    updateQuestMock.mockResolvedValue(updated);
    render(<QuestBoardPage />);
    await user.click(screen.getByRole('button', { name: 'Editar missão' }));
    await user.clear(screen.getByLabelText('Título da missão'));
    await user.type(screen.getByLabelText('Título da missão'), 'Nova');
    await user.clear(screen.getByLabelText('Descrição'));
    await user.type(screen.getByLabelText('Descrição'), 'Alterada');
    await user.click(screen.getByRole('button', { name: 'Difícil' }));
    await user.selectOptions(screen.getByLabelText('Status'), 'resolved');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(updateQuestMock).toHaveBeenCalledWith('q_1', {
      title: 'Nova',
      description: 'Alterada',
      difficulty: 'high',
      status: 'resolved',
    });
    expect(replaceQuest).toHaveBeenCalledWith(updated);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps edited fields visible when saving fails', async () => {
    const user = userEvent.setup();
    updateQuestMock.mockRejectedValue(new ApiError('Erro ao salvar'));
    render(<QuestBoardPage />);
    await user.click(screen.getByRole('button', { name: 'Editar missão' }));
    await user.click(screen.getByRole('button', { name: 'Fácil' }));
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Erro ao salvar');
    expect(screen.getByRole('button', { name: 'Fácil', pressed: true })).toBeInTheDocument();
    expect(replaceQuest).not.toHaveBeenCalled();
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
