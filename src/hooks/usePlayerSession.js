import { startTransition, useState } from 'react';
import { joinPlayerSession } from '../services/playerSessionsApi';

const initialJoinState = {
  loading: false,
  error: '',
  session: null,
};

export function usePlayerSession() {
  const [joinState, setJoinState] = useState(initialJoinState);

  const joinSession = async (formState) => {
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

  const resetSession = () => {
    setJoinState(initialJoinState);
  };

  return {
    joinState,
    joinSession,
    resetSession,
  };
}
