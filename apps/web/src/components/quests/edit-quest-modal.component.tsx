import { Button } from '@atomic/atm.button';
import { TextAreaInput, TextInput } from '@atomic/atm.text-input';
import { InputLabel } from '@atomic/atm.typography';
import { Col, Grid } from '@atomic/obj.grid';
import { Modal } from '@atomic/obj.modal';
import type { Quest, QuestDifficulty, QuestStatus, UpdateQuestInput } from '@domain/model/quest.model';
import { type FormEvent, useState } from 'react';
import { QUEST_DIFFICULTY_LABEL, QUEST_STATUS_COLUMNS } from './quest-presentation';

interface EditQuestModalProps {
  quest: Quest;
  onClose: () => void;
  onSubmit: (input: UpdateQuestInput) => Promise<boolean>;
  isLoading: boolean;
  errorMessage: string | null;
}

export function EditQuestModal({ quest, onClose, onSubmit, isLoading, errorMessage }: EditQuestModalProps) {
  const [title, setTitle] = useState(quest.title);
  const [description, setDescription] = useState(quest.description);
  const [difficulty, setDifficulty] = useState(quest.difficulty);
  const [status, setStatus] = useState(quest.status);
  const [attempted, setAttempted] = useState(false);
  const titleError = attempted && !title.trim();
  const descriptionError = attempted && !description.trim();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setAttempted(true);
    if (!title.trim() || !description.trim() || isLoading) {
      return;
    }
    const input: UpdateQuestInput = {};
    if (title.trim() !== quest.title) {
      input.title = title.trim();
    }
    if (description.trim() !== quest.description) {
      input.description = description.trim();
    }
    if (difficulty !== quest.difficulty) {
      input.difficulty = difficulty;
    }
    if (status !== quest.status) {
      input.status = status;
    }
    if (Object.keys(input).length === 0) {
      onClose();
      return;
    }
    await onSubmit(input);
  };

  return (
    <Modal opened onClose={onClose} title="Editar missão" small>
      <form onSubmit={handleSubmit} noValidate>
        <Grid>
          <Col sm={12} className="mb-md">
            <InputLabel htmlFor="edit-quest-title">Título da missão</InputLabel>
            <TextInput
              id="edit-quest-title"
              value={title}
              maxLength={200}
              required
              invalid={!!titleError}
              aria-invalid={!!titleError}
              aria-describedby={titleError ? 'edit-title-error' : undefined}
              onChange={value => setTitle(typeof value === 'string' ? value : value.target.value)}
            />
            {titleError && (
              <p id="edit-title-error" className="text-feedback-danger mt-xs text-sm">
                Informe o título da missão.
              </p>
            )}
          </Col>
          <Col sm={12} className="mb-md">
            <InputLabel htmlFor="edit-quest-description">Descrição</InputLabel>
            <TextAreaInput
              id="edit-quest-description"
              value={description}
              maxLength={5000}
              rows={4}
              required
              invalid={!!descriptionError}
              aria-invalid={!!descriptionError}
              aria-describedby={descriptionError ? 'edit-description-error' : undefined}
              onChange={event => setDescription(event.target.value)}
            />
            {descriptionError && (
              <p id="edit-description-error" className="text-feedback-danger mt-xs text-sm">
                Informe a descrição da missão.
              </p>
            )}
          </Col>
          <Col sm={12} className="mb-md">
            <fieldset>
              <legend className="text-tinta-2 mb-xs font-semibold">Dificuldade</legend>
              <div className="flex gap-sm">
                {(Object.keys(QUEST_DIFFICULTY_LABEL) as QuestDifficulty[]).map(option => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={difficulty === option}
                    onClick={() => setDifficulty(option)}
                    className={`flex-1 cursor-pointer rounded-[4px] border px-md py-xs font-semibold ${difficulty === option ? 'border-secondary-strong bg-secondary-strong text-fixed-white' : 'border-background-strong bg-neutral-xsoft text-tinta-2'}`}>
                    {QUEST_DIFFICULTY_LABEL[option]}
                  </button>
                ))}
              </div>
            </fieldset>
          </Col>
          <Col sm={12} className="mb-md">
            <InputLabel htmlFor="edit-quest-status">Status</InputLabel>
            <select
              id="edit-quest-status"
              value={status}
              onChange={event => setStatus(event.target.value as QuestStatus)}
              className="border-background-strong bg-neutral-xsoft text-tinta-2 w-full rounded-[4px] border p-sm">
              {QUEST_STATUS_COLUMNS.map(column => (
                <option key={column.status} value={column.status}>
                  {column.title}
                </option>
              ))}
            </select>
          </Col>
          <Col sm={12}>
            <Button type="submit" variant="cta" expanded loading={isLoading}>
              Salvar alterações
            </Button>
          </Col>
          {errorMessage && (
            <Col sm={12} className="mt-sm">
              <p role="alert" className="text-feedback-danger text-sm">
                {errorMessage}
              </p>
            </Col>
          )}
        </Grid>
      </form>
    </Modal>
  );
}
