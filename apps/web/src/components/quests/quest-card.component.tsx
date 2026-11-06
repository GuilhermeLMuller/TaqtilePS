import { FaIcon } from '@atomic/atm.fa-icon';
import type { Quest, QuestStatus } from '@domain/model/quest.model';
import { style } from './quest-card.component.style';
import { ADVANCE_LABEL, QUEST_DIFFICULTY_LABEL, formatQuestAge } from './quest-presentation';

interface QuestCardProps {
  quest: Quest;
  columnStatus: QuestStatus;
  onAdvance: (quest: Quest) => void;
  onEdit: (quest: Quest) => void;
  isUpdating: boolean;
}

export function QuestCard(props: QuestCardProps) {
  const { quest, columnStatus, onAdvance, onEdit, isUpdating } = props;
  const advanceLabel = ADVANCE_LABEL[columnStatus];
  const classes = style({ columnStatus });

  return (
    <article className={classes.card()}>
      <h3 className={classes.title()}>{quest.title}</h3>
      <p className={classes.description()}>{quest.description}</p>
      <div className={classes.tags()}>
        <span className={classes.difficulty()}>{QUEST_DIFFICULTY_LABEL[quest.difficulty]}</span>
      </div>
      <div className={classes.footer()}>
        <span className={classes.meta()}>
          <FaIcon.StarFull className={classes.xpIcon()} />
          {quest.xpReward} XP
        </span>
        <span className={classes.meta()}>{formatQuestAge(quest.createdAt)}</span>
      </div>
      <button type="button" onClick={() => onEdit(quest)} disabled={isUpdating} className={classes.advanceButton()}>
        Editar missão
      </button>
      {advanceLabel ? (
        <button
          type="button"
          onClick={() => onAdvance(quest)}
          disabled={isUpdating}
          className={classes.advanceButton()}>
          {advanceLabel}
        </button>
      ) : (
        <div className={classes.completed()}>
          <FaIcon.Check className={classes.completedIcon()} />
          Cantada pelos bardos
        </div>
      )}
    </article>
  );
}
