import { ApiError } from '@core/http/http-client';
import { getPlayerProgress, type PlayerProgress } from '@data/player/player.datasource';
import { useCallback, useEffect, useRef, useState } from 'react';

export function usePlayerProgress() {
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  const refetch = useCallback(async () => {
    requestRef.current?.abort();
    const request = new AbortController();
    requestRef.current = request;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getPlayerProgress(request.signal);
      if (!request.signal.aborted) {
        setProgress(result);
      }
    } catch (err) {
      if (!request.signal.aborted) {
        setError(err instanceof ApiError ? err : new ApiError('Falha ao carregar o progresso'));
      }
    } finally {
      if (!request.signal.aborted) {
        setIsLoading(false);
        requestRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    void refetch();
    return () => requestRef.current?.abort();
  }, [refetch]);

  return { progress, isLoading, error, refetch };
}
