import type { Quest, QuestStatus } from '@domain/model/quest.model';
import { QuestCard } from './quest-card.component';

interface QuestColumnProps {
  status: QuestStatus;
  title: string;
  subtitle: string;
  quests: Quest[];
  onAdvance: (quest: Quest) => void;
  onEdit: (quest: Quest) => void;
  onRemove: (quest: Quest) => void;
  isUpdating: boolean;
}

export const QuestColumn = ({
  status,
  title,
  subtitle,
  quests,
  onAdvance,
  onEdit,
  onRemove,
  isUpdating,
}: QuestColumnProps) => (
  <section
    className="border-background-strong flex flex-col rounded-[6px] border"
    style={{ background: 'var(--pergaminho-coluna)' }}>
    <div className="border-background-strong flex items-center justify-between gap-sm border-b px-[16px] pt-[14px] pb-[12px]">
      <div>
        <h2 className="font-secondary text-neutral-strong m-0 text-[16px] font-bold tracking-[0.04em]">{title}</h2>
        <span className="text-[14px] italic" style={{ color: 'var(--tinta-3)' }}>
          {subtitle}
        </span>
      </div>
      <span
        className="font-secondary flex h-[28px] min-w-[28px] items-center justify-center rounded-full px-sm text-[13px] font-bold"
        style={{ background: 'var(--color-neutral-strong)', color: 'var(--color-primary-soft)' }}>
        {quests.length}
      </span>
    </div>

    <div className="flex flex-col gap-[12px] p-[12px]">
      {quests.length === 0 && (
        <div
          className="border-background-strong rounded-[4px] border border-dashed p-[24px_12px] text-center text-[16px] italic"
          style={{ color: 'var(--tinta-3)' }}>
          Nenhum pergaminho aqui.
        </div>
      )}
      {quests.map(quest => (
        <QuestCard
          key={quest.id}
          quest={quest}
          columnStatus={status}
          onAdvance={onAdvance}
          onEdit={onEdit}
          onRemove={onRemove}
          isUpdating={isUpdating}
        />
      ))}
    </div>
  </section>
);
