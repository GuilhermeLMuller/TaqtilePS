import { Button } from '@atomic/atm.button';
import { TextAreaInput, TextInput } from '@atomic/atm.text-input';
import { InputLabel } from '@atomic/atm.typography';
import { Col, Grid } from '@atomic/obj.grid';
import { Modal } from '@atomic/obj.modal';
import type { QuestDifficulty, QuestInput } from '@domain/model/quest.model';
import { type FormEvent, useRef, useState } from 'react';
import { QUEST_DIFFICULTY_LABEL } from './quest-presentation';

const TITLE_MAX_LENGTH = 200;
const DESCRIPTION_MAX_LENGTH = 5000;
const TITLE_REQUIRED_MESSAGE = 'Informe o título da missão.';
const DESCRIPTION_REQUIRED_MESSAGE = 'Informe a descrição da missão.';

interface CreateQuestModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (input: QuestInput) => Promise<boolean>;
  isLoading: boolean;
  errorMessage?: string | null;
}

export function CreateQuestModal(props: CreateQuestModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<QuestDifficulty>('normal');
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Errors only show after a submit attempt, so an untouched form doesn't open already flagged.
  const titleError = submitAttempted && !title.trim() ? TITLE_REQUIRED_MESSAGE : undefined;
  const descriptionError = submitAttempted && !description.trim() ? DESCRIPTION_REQUIRED_MESSAGE : undefined;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitAttempted(true);
    if (!title.trim()) {
      titleRef.current?.focus();
      return;
    }
    if (!description.trim()) {
      descriptionRef.current?.focus();
      return;
    }
    if (props.isLoading) {
      return;
    }

    const succeeded = await props.onSubmit({ title: title.trim(), description: description.trim(), difficulty });
    if (succeeded) {
      setTitle('');
      setDescription('');
      setDifficulty('normal');
      setSubmitAttempted(false);
    }
  };

  const handleClose = () => {
    setSubmitAttempted(false);
    props.onClose();
  };

  return (
    <Modal opened={props.opened} onClose={handleClose} title="Nova missão" small>
      <form onSubmit={handleSubmit} noValidate>
        <Grid>
          <Col sm={12} className="mb-md">
            <InputLabel htmlFor="quest-title">Título da missão</InputLabel>
            <TextInput
              ref={titleRef}
              id="quest-title"
              value={title}
              onChange={eventOrValue =>
                setTitle(typeof eventOrValue === 'string' ? eventOrValue : eventOrValue.target.value)
              }
              maxLength={TITLE_MAX_LENGTH}
              placeholder="Enfrentar o dragão"
              required
              invalid={!!titleError}
              aria-invalid={!!titleError}
              aria-describedby={titleError ? 'quest-title-error' : undefined}
            />
            {titleError && (
              <p id="quest-title-error" className="text-feedback-danger mt-xs text-sm">
                {titleError}
              </p>
            )}
          </Col>
          <Col sm={12} className="mb-md">
            <InputLabel htmlFor="quest-description">Descrição</InputLabel>
            <TextAreaInput
              ref={descriptionRef}
              id="quest-description"
              value={description}
              onChange={event => setDescription(event.target.value)}
              maxLength={DESCRIPTION_MAX_LENGTH}
              rows={4}
              placeholder="Derrote a fera nas montanhas ao norte e traga prova da vitória."
              required
              invalid={!!descriptionError}
              aria-invalid={!!descriptionError}
              aria-describedby={descriptionError ? 'quest-description-error' : undefined}
            />
            {descriptionError && (
              <p id="quest-description-error" className="text-feedback-danger mt-xs text-sm">
                {descriptionError}
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
                    className={`flex-1 cursor-pointer rounded-[4px] border px-md py-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                      difficulty === option
                        ? 'border-secondary-strong bg-secondary-strong text-fixed-white'
                        : 'border-background-strong bg-neutral-xsoft text-tinta-2'
                    }`}>
                    {QUEST_DIFFICULTY_LABEL[option]}
                  </button>
                ))}
              </div>
            </fieldset>
          </Col>
          <Col sm={12}>
            <Button type="submit" variant="cta" expanded loading={props.isLoading}>
              Publicar missão
            </Button>
          </Col>
          {props.errorMessage && (
            <Col sm={12} className="mt-sm">
              <p role="alert" className="text-feedback-danger text-sm">
                {props.errorMessage}
              </p>
            </Col>
          )}
        </Grid>
      </form>
    </Modal>
  );
}
