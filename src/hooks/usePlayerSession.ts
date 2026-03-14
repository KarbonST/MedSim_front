import { startTransition, useState } from 'react';
import { joinPlayerSession } from '../services/playerSessionsApi';
import type { JoinState, PlayerFormState, PlayerSession } from '../types/app';

const initialJoinState: JoinState = {
  loading: false,
  error: '',
  session: null,
};

export function usePlayerSession(initialSession: PlayerSession | null = null) {
  const [joinState, setJoinState] = useState<JoinState>({
    ...initialJoinState,
    session: initialSession,
  });

  const joinSession = async (formState: PlayerFormState): Promise<void> => {
    setJoinState((current) => ({ ...current, loading: true, error: '' }));

    try {
      const payload = await joinPlayerSession({
        displayName: formState.name,
        hospitalPosition: formState.hospitalRole,
        sessionCode: formState.sessionCode,
      });

      startTransition(() => {
        setJoinState({
          loading: false,
          error: '',
          session: payload,
        });
      });
    } catch (error) {
      setJoinState({
        loading: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка.',
        session: null,
      });
    }
  };

  const resetSession = (): void => {
    setJoinState(initialJoinState);
  };

  return {
    joinState,
    joinSession,
    resetSession,
  };
}
