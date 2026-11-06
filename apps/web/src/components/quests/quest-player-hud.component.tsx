import type { PlayerProgress } from '@data/player/player.datasource';

interface QuestPlayerHudProps {
  progress: PlayerProgress | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export const QuestPlayerHud = ({ progress, isLoading, error, onRetry }: QuestPlayerHudProps) => (
  <div
    className="flex flex-wrap items-center gap-x-[28px] gap-y-[20px] rounded-[6px] border px-[22px] py-[16px]"
    style={{
      background: 'var(--color-neutral-strong)',
      borderColor: 'var(--color-primary-strong)',
      color: 'var(--ficha-texto)',
      boxShadow: 'inset 0 0 0 4px var(--color-neutral-strong), inset 0 0 0 5px var(--ficha-borda)',
    }}>
    <div className="flex items-center gap-[14px]">
      <div
        className="font-secondary flex h-[52px] w-[52px] items-center justify-center rounded-full border-2 text-[18px] font-bold"
        style={{
          background: 'var(--color-cta-medium)',
          borderColor: 'var(--color-primary-medium)',
          color: 'var(--avatar-texto)',
        }}>
        R
      </div>
      <div>
        <div className="font-secondary text-[19px] font-bold" style={{ color: 'var(--ficha-nome)' }}>
          Recruta
        </div>
        <div className="text-[15px] italic" style={{ color: 'var(--ficha-apoio)' }}>
          Recruta da Guilda Taqtile{progress && ` · Nível ${progress.level}`}
        </div>
      </div>
    </div>

    <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-[6px]">
      {isLoading && !progress && <span>Carregando progresso...</span>}
      {error && (
        <div role="alert">
          {error}{' '}
          <button type="button" onClick={onRetry} className="underline">
            Tentar novamente
          </button>
        </div>
      )}
      {progress && (
        <>
          <div className="flex justify-between text-[15px]" style={{ color: 'var(--ficha-xp-rotulo)' }}>
            <span>Experiência</span>
            <span className="font-secondary text-[13px]" style={{ color: 'var(--color-primary-soft)' }}>
              {progress.currentXp} / 100 XP
            </span>
          </div>
          <div
            // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
            role="progressbar"
            aria-label="Experiência até o próximo nível"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress.currentXp}
            className="h-[12px] overflow-hidden rounded-[6px] border"
            style={{ background: 'var(--ficha-xp-trilho)', borderColor: 'var(--ficha-borda)' }}>
            <div
              className="h-full"
              style={{ width: `${progress.currentXp}%`, background: 'var(--color-primary-medium)' }}
            />
          </div>
        </>
      )}
    </div>
  </div>
);
