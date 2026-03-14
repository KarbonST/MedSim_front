import { startTransition, useState } from 'react';
import { fetchGameSessionParticipants } from '../services/gameSessionsApi';
import type { SessionOverviewState } from '../types/app';

const initialSessionOverviewState: SessionOverviewState = {
  loading: false,
  error: '',
  session: null,
};

export function useFacilitatorSessionOverview() {
  const [overviewState, setOverviewState] = useState<SessionOverviewState>(
    initialSessionOverviewState,
  );

  const loadSession = async (sessionCode: string): Promise<void> => {
    setOverviewState((current) => ({ ...current, loading: true, error: '' }));

    try {
      const payload = await fetchGameSessionParticipants(sessionCode.trim());

      startTransition(() => {
        setOverviewState({
          loading: false,
          error: '',
          session: payload,
        });
      });
    } catch (error) {
      setOverviewState({
        loading: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка.',
        session: null,
      });
    }
  };

  const resetOverview = (): void => {
    setOverviewState(initialSessionOverviewState);
  };

  return {
    overviewState,
    loadSession,
    resetOverview,
  };
}
