import { ApiError } from '@core/http/http-client';
import { listQuests } from '@data/quests/quests.datasource';
import type { Quest } from '@domain/model/quest.model';
import { useCallback, useEffect, useRef, useState } from 'react';

const BOARD_SIZE = 100;

interface UseListQuestsResult {
  quests: Quest[];
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
  replaceQuest: (quest: Quest) => void;
}

export function useListQuests(): UseListQuestsResult {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    // Only the latest request may update the state: a slower, older response must not overwrite it.
    requestRef.current?.abort();
    const request = new AbortController();
    requestRef.current = request;

    setIsLoading(true);
    setError(null);

    try {
      const result = await listQuests({ limit: BOARD_SIZE }, request.signal);
      if (!request.signal.aborted) {
        setQuests(result.nodes);
      }
    } catch (err) {
      if (!request.signal.aborted) {
        setError(err instanceof ApiError ? err : new ApiError('Falha ao carregar as missões'));
      }
    } finally {
      if (!request.signal.aborted) {
        setIsLoading(false);
        requestRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    load();
    return () => requestRef.current?.abort();
  }, [load]);

  const replaceQuest = useCallback(
    (quest: Quest) => {
      const wasLoading = requestRef.current !== null;
      requestRef.current?.abort();
      setIsLoading(false);
      setQuests(previous => previous.map(item => (item.id === quest.id ? quest : item)));
      if (wasLoading) {
        load();
      }
    },
    [load],
  );

  return { quests, isLoading, error, refetch: load, replaceQuest };
}
