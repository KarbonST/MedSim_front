import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import BrandHeader from './components/BrandHeader';
import FacilitatorSessionPage from './components/FacilitatorSessionPage';
import ModeSwitch from './components/ModeSwitch';
import PlayerEntryForm from './components/PlayerEntryForm';
import SessionWaitingRoom from './components/SessionWaitingRoom';
import StaffLoginForm from './components/StaffLoginForm';
import { accessProfiles } from './constants/accessProfiles';
import { playerRoles } from './constants/playerRoles';
import { useFacilitatorSessionOverview } from './hooks/useFacilitatorSessionOverview';
import { useGameSessionsList } from './hooks/useGameSessionsList';
import {
  deleteGameSession,
  finishGameSession,
  startGameSession,
} from './services/gameSessionsApi';
import { usePlayerSession } from './hooks/usePlayerSession';
import type { Mode, PlayerFormState, StaffFormState } from './types/app';

function App() {
  const [mode, setMode] = useState<Mode>('player');
  const [playerForm, setPlayerForm] = useState<PlayerFormState>({
    name: '',
    hospitalRole: playerRoles[0],
    sessionCode: '',
  });
  const [staffForm, setStaffForm] = useState<StaffFormState>({
    profile: accessProfiles[0].id,
    login: '',
    password: '',
  });
  const [staffError, setStaffError] = useState('');
  const [facilitatorSessionCode, setFacilitatorSessionCode] = useState('');
  const [facilitatorActionCode, setFacilitatorActionCode] = useState('');
  const [facilitatorActionError, setFacilitatorActionError] = useState('');
  const [isFacilitatorWorkspaceOpen, setIsFacilitatorWorkspaceOpen] = useState(false);
  const { joinState, joinSession, resetSession } = usePlayerSession();
  const { overviewState, loadSession, resetOverview } = useFacilitatorSessionOverview();
  const { sessionsState, loadSessions, resetSessions } = useGameSessionsList();

  useEffect(() => {
    if (!isFacilitatorWorkspaceOpen) {
      return;
    }

    void loadSessions();
  }, [isFacilitatorWorkspaceOpen]);

  const updatePlayerForm = (field: keyof PlayerFormState, value: string): void => {
    setPlayerForm((current) => ({ ...current, [field]: value }));
  };

  const updateStaffForm = (field: keyof StaffFormState, value: string): void => {
    setStaffError('');
    setStaffForm((current) => ({ ...current, [field]: value }));
  };

  const handlePlayerSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    await joinSession(playerForm);
  };

  const handleStaffSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const trimmedLogin = staffForm.login.trim();
    const trimmedPassword = staffForm.password.trim();

    if (!trimmedLogin || !trimmedPassword) {
      setStaffError('Введите логин и пароль, чтобы открыть служебный режим.');
      return;
    }

    if (staffForm.profile === 'superuser') {
      setStaffError('Экран суперпользователя добавим следующим шагом. Сейчас доступна панель ведущего.');
      return;
    }

    setStaffError('');
    setFacilitatorActionError('');
    setIsFacilitatorWorkspaceOpen(true);
  };

  const handleLookupSession = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setFacilitatorActionError('');
    await loadSession(facilitatorSessionCode);
  };

  const handleRefreshSession = async (): Promise<void> => {
    if (!facilitatorSessionCode.trim()) {
      return;
    }

    setFacilitatorActionError('');
    await loadSession(facilitatorSessionCode);
  };

  const handleRefreshSessions = async (): Promise<void> => {
    setFacilitatorActionError('');
    await loadSessions();
  };

  const handleOpenSession = async (sessionCode: string): Promise<void> => {
    setFacilitatorActionError('');
    setFacilitatorSessionCode(sessionCode);
    await loadSession(sessionCode);
  };

  const syncAfterSessionMutation = async (sessionCode: string): Promise<void> => {
    await loadSessions();

    if (
      overviewState.session?.sessionCode === sessionCode ||
      facilitatorSessionCode === sessionCode
    ) {
      await loadSession(sessionCode);
    }
  };

  const handleStartSession = async (sessionCode: string): Promise<void> => {
    setFacilitatorActionCode(sessionCode);
    setFacilitatorActionError('');

    try {
      await startGameSession(sessionCode);
      await syncAfterSessionMutation(sessionCode);
    } catch (error) {
      setFacilitatorActionError(
        error instanceof Error ? error.message : 'Не удалось запустить сессию.',
      );
    } finally {
      setFacilitatorActionCode('');
    }
  };

  const handleFinishSession = async (sessionCode: string): Promise<void> => {
    setFacilitatorActionCode(sessionCode);
    setFacilitatorActionError('');

    try {
      await finishGameSession(sessionCode);
      await syncAfterSessionMutation(sessionCode);
    } catch (error) {
      setFacilitatorActionError(
        error instanceof Error ? error.message : 'Не удалось завершить сессию.',
      );
    } finally {
      setFacilitatorActionCode('');
    }
  };

  const handleDeleteSession = async (sessionCode: string): Promise<void> => {
    const shouldDelete = window.confirm(
      `Удалить сессию ${sessionCode} вместе с её участниками?`,
    );

    if (!shouldDelete) {
      return;
    }

    setFacilitatorActionCode(sessionCode);
    setFacilitatorActionError('');

    try {
      await deleteGameSession(sessionCode);
      await loadSessions();

      if (
        overviewState.session?.sessionCode === sessionCode ||
        facilitatorSessionCode === sessionCode
      ) {
        setFacilitatorSessionCode('');
        resetOverview();
      }
    } catch (error) {
      setFacilitatorActionError(
        error instanceof Error ? error.message : 'Не удалось удалить сессию.',
      );
    } finally {
      setFacilitatorActionCode('');
    }
  };

  const handleResetPlayerFlow = (): void => {
    resetSession();
    setPlayerForm((current) => ({ ...current, sessionCode: '' }));
  };

  const handleCloseFacilitatorWorkspace = (): void => {
    setIsFacilitatorWorkspaceOpen(false);
    setFacilitatorSessionCode('');
    setFacilitatorActionCode('');
    setFacilitatorActionError('');
    setStaffError('');
    resetOverview();
    resetSessions();
  };

  const handleModeChange = (nextMode: Mode): void => {
    setMode(nextMode);
    setStaffError('');
  };

  const facilitatorError = facilitatorActionError || overviewState.error || sessionsState.error;

  return (
    <main className="page-shell">
      <section className="form-panel">
        {joinState.session ? (
          <SessionWaitingRoom session={joinState.session} onReset={handleResetPlayerFlow} />
        ) : isFacilitatorWorkspaceOpen ? (
          <FacilitatorSessionPage
            login={staffForm.login.trim()}
            sessionCode={facilitatorSessionCode}
            loading={overviewState.loading}
            sessionsLoading={sessionsState.loading}
            actionSessionCode={facilitatorActionCode}
            error={facilitatorError}
            session={overviewState.session}
            sessions={sessionsState.sessions}
            onSessionCodeChange={setFacilitatorSessionCode}
            onLookupSession={handleLookupSession}
            onRefresh={handleRefreshSession}
            onRefreshSessions={handleRefreshSessions}
            onOpenSession={handleOpenSession}
            onStartSession={handleStartSession}
            onFinishSession={handleFinishSession}
            onDeleteSession={handleDeleteSession}
            onBack={handleCloseFacilitatorWorkspace}
          />
        ) : (
          <>
            <BrandHeader
              eyebrow="Вход в систему симуляции"
              title="Регистрация и авторизация"
            />

            <ModeSwitch mode={mode} onChange={handleModeChange} />

            {mode === 'player' ? (
              <PlayerEntryForm
                formState={playerForm}
                onChange={updatePlayerForm}
                onSubmit={handlePlayerSubmit}
                loading={joinState.loading}
                error={joinState.error}
              />
            ) : (
              <StaffLoginForm
                formState={staffForm}
                onChange={updateStaffForm}
                onSubmit={handleStaffSubmit}
                error={staffError}
              />
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default App;
