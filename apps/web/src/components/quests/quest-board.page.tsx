import { Button } from '@atomic/atm.button';
import { Body } from '@atomic/atm.typography';
import { LoadingCentered } from '@atomic/mol.loading';
import { Col, Grid } from '@atomic/obj.grid';
import { ApiError } from '@core/http/http-client';
import { updateQuest } from '@data/quests/quests.datasource';
import type { Quest, QuestInput, UpdateQuestInput } from '@domain/model/quest.model';
import { usePlayerProgress } from '@domain/player/use-player-progress.use-case';
import { useCreateQuest } from '@domain/quests/use-create-quest.use-case';
import { useListQuests } from '@domain/quests/use-list-quests.use-case';
import { useMemo, useRef, useState } from 'react';
import { CreateQuestModal } from './create-quest-modal.component';
import { EditQuestModal } from './edit-quest-modal.component';
import { QuestBoardHeader } from './quest-board-header.component';
import { QuestColumn } from './quest-column.component';
import { QuestPlayerHud } from './quest-player-hud.component';
import { NEXT_STATUS, QUEST_STATUS_COLUMNS } from './quest-presentation';

const QuestBoardPage = () => {
  const { quests, isLoading, error, refetch, replaceQuest } = useListQuests();
  const { createQuest, isLoading: isCreating, error: createError } = useCreateQuest();
  const {
    progress,
    isLoading: isLoadingProgress,
    error: progressError,
    refetch: refetchProgress,
  } = usePlayerProgress();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const updating = useRef(false);
  // Only the first load replaces the board with a spinner; refetches keep the current columns on screen.
  const isInitialLoading = isLoading && quests.length === 0;

  const saveQuest = async (quest: Quest, input: UpdateQuestInput): Promise<boolean> => {
    if (updating.current) {
      return false;
    }
    updating.current = true;
    setIsUpdating(true);
    setUpdateError(null);
    try {
      const updated = await updateQuest(quest.id, input);
      replaceQuest(updated);
      void refetchProgress();
      return true;
    } catch (err) {
      setUpdateError(err instanceof ApiError ? err.message : 'Falha ao atualizar a missão');
      return false;
    } finally {
      updating.current = false;
      setIsUpdating(false);
    }
  };

  const handleAdvance = async (quest: Quest) => {
    const next = NEXT_STATUS[quest.status];
    if (!next) {
      return;
    }

    await saveQuest(quest, { status: next });
  };

  const columns = useMemo(
    () =>
      QUEST_STATUS_COLUMNS.map(column => ({
        ...column,
        quests: quests.filter(quest => quest.status === column.status),
      })),
    [quests],
  );

  const handleCreateQuest = async (input: QuestInput) => {
    const created = await createQuest(input);
    if (created) {
      setIsCreateModalOpen(false);
      refetch();
    }
    return Boolean(created);
  };

  return (
    <Grid className="max-w-[1100px] py-lg">
      <Col sm={12} className="mb-lg">
        <QuestBoardHeader onCreateClick={() => setIsCreateModalOpen(true)} />
      </Col>

      <Col sm={12} className="mb-lg">
        <QuestPlayerHud
          progress={progress}
          isLoading={isLoadingProgress}
          error={progressError?.message ?? null}
          onRetry={refetchProgress}
        />
      </Col>

      {updateError && !editingQuest && (
        <Col sm={12}>
          <p role="alert" className="text-feedback-danger mb-md">
            {updateError}
          </p>
        </Col>
      )}

      {isInitialLoading && (
        <Col sm={12}>
          <LoadingCentered />
        </Col>
      )}

      {!isLoading && error && (
        <Col sm={12} className="text-center">
          <Body role="alert">{error.message}</Body>
          <Button variant="secondary" onClick={refetch} className="mt-md">
            Tentar de novo
          </Button>
        </Col>
      )}

      {!isInitialLoading && !error && (
        <Col sm={12}>
          <div className="grid grid-cols-3 items-start gap-[18px]">
            {columns.map(column => (
              <QuestColumn
                key={column.status}
                status={column.status}
                title={column.title}
                subtitle={column.subtitle}
                quests={column.quests}
                onAdvance={handleAdvance}
                onEdit={quest => {
                  setUpdateError(null);
                  setEditingQuest(quest);
                }}
                isUpdating={isUpdating}
              />
            ))}
          </div>
        </Col>
      )}

      <CreateQuestModal
        opened={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateQuest}
        isLoading={isCreating}
        errorMessage={createError?.message}
      />
      {editingQuest && (
        <EditQuestModal
          quest={editingQuest}
          onClose={() => {
            if (!updating.current) {
              setEditingQuest(null);
              setUpdateError(null);
            }
          }}
          onSubmit={async input => {
            const succeeded = await saveQuest(editingQuest, input);
            if (succeeded) {
              setEditingQuest(null);
            }
            return succeeded;
          }}
          isLoading={isUpdating}
          errorMessage={updateError}
        />
      )}
    </Grid>
  );
};

export default QuestBoardPage;
