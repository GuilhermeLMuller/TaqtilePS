import { Button } from '@atomic/atm.button';
import { Modal } from '@atomic/obj.modal';
import type { Quest } from '@domain/model/quest.model';

interface RemoveQuestModalProps {
  quest: Quest;
  isLoading: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function RemoveQuestModal({ quest, isLoading, errorMessage, onClose, onConfirm }: RemoveQuestModalProps) {
  return (
    <Modal opened onClose={onClose} title="Remover missão" small>
      <p>
        Deseja remover a missão <strong>{quest.title}</strong>?
      </p>
      {errorMessage && (
        <p role="alert" className="text-feedback-danger mt-sm">
          {errorMessage}
        </p>
      )}
      <div className="mt-md flex gap-sm">
        <Button variant="secondary" disabled={isLoading} onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="danger" loading={isLoading} onClick={onConfirm}>
          Sim, remover
        </Button>
      </div>
    </Modal>
  );
}
