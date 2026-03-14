import { startTransition, useState } from 'react';
import { fetchAvailablePlayerSessions } from '../services/playerSessionsApi';
import type { AvailablePlayerSessionsState } from '../types/app';

const initialAvailableSessionsState: AvailablePlayerSessionsState = {
  loading: false,
  error: '',
  sessions: [],
};

export function useAvailablePlayerSessions() {
  const [availableSessionsState, setAvailableSessionsState] = useState<AvailablePlayerSessionsState>(
    initialAvailableSessionsState,
  );

  const loadAvailableSessions = async (): Promise<void> => {
    setAvailableSessionsState((current) => ({ ...current, loading: true, error: '' }));

    try {
      const payload = await fetchAvailablePlayerSessions();

      startTransition(() => {
        setAvailableSessionsState({
          loading: false,
          error: '',
          sessions: payload,
        });
      });
    } catch (error) {
      setAvailableSessionsState({
        loading: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка.',
        sessions: [],
      });
    }
  };

  const resetAvailableSessions = (): void => {
    setAvailableSessionsState(initialAvailableSessionsState);
  };

  return {
    availableSessionsState,
    loadAvailableSessions,
    resetAvailableSessions,
  };
}
