import { startTransition, useState } from 'react';
import { fetchGameSessions } from '../services/gameSessionsApi';
import type { SessionsListState } from '../types/app';

const initialSessionsListState: SessionsListState = {
  loading: false,
  error: '',
  sessions: [],
};

export function useGameSessionsList() {
  const [sessionsState, setSessionsState] = useState<SessionsListState>(
    initialSessionsListState,
  );

  const loadSessions = async (authHeader: string): Promise<void> => {
    setSessionsState((current) => ({ ...current, loading: true, error: '' }));

    try {
      const payload = await fetchGameSessions(authHeader);

      startTransition(() => {
        setSessionsState({
          loading: false,
          error: '',
          sessions: payload,
        });
      });
    } catch (error) {
      setSessionsState({
        loading: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка.',
        sessions: [],
      });
    }
  };

  const resetSessions = (): void => {
    setSessionsState(initialSessionsListState);
  };

  return {
    sessionsState,
    loadSessions,
    resetSessions,
  };
}
