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
  assignManualGameRole,
  assignRandomGameRoles,
  deleteGameSession,
  finishGameSession,
  saveGameSessionStages,
  startGameSession,
} from './services/gameSessionsApi';
import { createBasicAuthHeader, fetchStaffProfile } from './services/staffAuthApi';
import { usePlayerSession } from './hooks/usePlayerSession';
import type {
  GameSessionStageSettingsRequest,
  Mode,
  PlayerFormState,
  StaffFormState,
} from './types/app';

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
  const [staffAuthHeader, setStaffAuthHeader] = useState('');
  const [facilitatorSessionCode, setFacilitatorSessionCode] = useState('');
  const [facilitatorActionCode, setFacilitatorActionCode] = useState('');
  const [facilitatorActionError, setFacilitatorActionError] = useState('');
  const [facilitatorSetupLoading, setFacilitatorSetupLoading] = useState(false);
  const [facilitatorRandomRoleLoading, setFacilitatorRandomRoleLoading] = useState(false);
  const [facilitatorRoleParticipantId, setFacilitatorRoleParticipantId] = useState<number | null>(null);
  const [isFacilitatorWorkspaceOpen, setIsFacilitatorWorkspaceOpen] = useState(false);
  const { joinState, joinSession, resetSession } = usePlayerSession();
  const { overviewState, loadSession, resetOverview } = useFacilitatorSessionOverview();
  const { sessionsState, loadSessions, resetSessions } = useGameSessionsList();

  useEffect(() => {
    if (!isFacilitatorWorkspaceOpen || !staffAuthHeader) {
      return;
    }

    void loadSessions(staffAuthHeader);
  }, [isFacilitatorWorkspaceOpen, staffAuthHeader]);

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

  const handleStaffSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const trimmedLogin = staffForm.login.trim();
    const trimmedPassword = staffForm.password.trim();

    if (!trimmedLogin || !trimmedPassword) {
      setStaffError('Введите логин и пароль, чтобы открыть служебный режим.');
      return;
    }

    if (staffForm.profile === 'superuser') {
      setStaffError('Для суперпользователя backend-авторизацию добавим следующим шагом. Сейчас доступен тестовый ведущий.');
      return;
    }

    try {
      const authHeader = createBasicAuthHeader(trimmedLogin, trimmedPassword);
      const profile = await fetchStaffProfile(authHeader);

      if (profile.systemRole !== 'FACILITATOR') {
        setStaffError('Эта учётная запись не относится к ведущему.');
        return;
      }

      setStaffError('');
      setFacilitatorActionError('');
      setStaffAuthHeader(authHeader);
      setIsFacilitatorWorkspaceOpen(true);
    } catch (error) {
      setStaffError(error instanceof Error ? error.message : 'Не удалось выполнить вход.');
    }
  };

  const handleLookupSession = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!staffAuthHeader) {
      setFacilitatorActionError('Нужно заново войти под учётной записью ведущего.');
      return;
    }

    setFacilitatorActionError('');
    await loadSession(facilitatorSessionCode, staffAuthHeader);
  };

  const handleRefreshSession = async (): Promise<void> => {
    if (!facilitatorSessionCode.trim() || !staffAuthHeader) {
      return;
    }

    setFacilitatorActionError('');
    await loadSession(facilitatorSessionCode, staffAuthHeader);
  };

  const handleRefreshSessions = async (): Promise<void> => {
    if (!staffAuthHeader) {
      setFacilitatorActionError('Нужно заново войти под учётной записью ведущего.');
      return;
    }

    setFacilitatorActionError('');
    await loadSessions(staffAuthHeader);
  };

  const handleOpenSession = async (sessionCode: string): Promise<void> => {
    if (!staffAuthHeader) {
      setFacilitatorActionError('Нужно заново войти под учётной записью ведущего.');
      return;
    }

    setFacilitatorActionError('');
    setFacilitatorSessionCode(sessionCode);
    await loadSession(sessionCode, staffAuthHeader);
  };

  const syncAfterSessionMutation = async (sessionCode: string): Promise<void> => {
    if (!staffAuthHeader) {
      setFacilitatorActionError('Нужно заново войти под учётной записью ведущего.');
      return;
    }

    await Promise.all([
      loadSessions(staffAuthHeader),
      loadSession(sessionCode, staffAuthHeader),
    ]);
  };

  const handleSaveStages = async (
    sessionCode: string,
    request: GameSessionStageSettingsRequest,
  ): Promise<void> => {
    if (!staffAuthHeader) {
      setFacilitatorActionError('Нужно заново войти под учётной записью ведущего.');
      return;
    }

    setFacilitatorActionError('');
    setFacilitatorSetupLoading(true);

    try {
      await saveGameSessionStages(sessionCode, request, staffAuthHeader);
      await syncAfterSessionMutation(sessionCode);
    } catch (error) {
      setFacilitatorActionError(
        error instanceof Error ? error.message : 'Не удалось сохранить настройки этапов.',
      );
    } finally {
      setFacilitatorSetupLoading(false);
    }
  };

  const handleAssignRandomRoles = async (sessionCode: string): Promise<void> => {
    if (!staffAuthHeader) {
      setFacilitatorActionError('Нужно заново войти под учётной записью ведущего.');
      return;
    }

    setFacilitatorActionError('');
    setFacilitatorRandomRoleLoading(true);

    try {
      await assignRandomGameRoles(sessionCode, staffAuthHeader);
      await syncAfterSessionMutation(sessionCode);
    } catch (error) {
      setFacilitatorActionError(
        error instanceof Error ? error.message : 'Не удалось автоматически распределить роли.',
      );
    } finally {
      setFacilitatorRandomRoleLoading(false);
    }
  };

  const handleAssignManualRole = async (
    sessionCode: string,
    participantId: number,
    gameRole: string,
  ): Promise<void> => {
    if (!staffAuthHeader) {
      setFacilitatorActionError('Нужно заново войти под учётной записью ведущего.');
      return;
    }

    const trimmedRole = gameRole.trim();

    if (!trimmedRole) {
      setFacilitatorActionError('Укажите игровую роль перед сохранением.');
      return;
    }

    setFacilitatorActionError('');
    setFacilitatorRoleParticipantId(participantId);

    try {
      await assignManualGameRole(
        sessionCode,
        participantId,
        { gameRole: trimmedRole },
        staffAuthHeader,
      );
      await loadSession(sessionCode, staffAuthHeader);
    } catch (error) {
      setFacilitatorActionError(
        error instanceof Error ? error.message : 'Не удалось назначить роль участнику.',
      );
    } finally {
      setFacilitatorRoleParticipantId(null);
    }
  };

  const handleStartSession = async (sessionCode: string): Promise<void> => {
    if (!staffAuthHeader) {
      setFacilitatorActionError('Нужно заново войти под учётной записью ведущего.');
      return;
    }

    setFacilitatorActionCode(sessionCode);
    setFacilitatorActionError('');

    try {
      await startGameSession(sessionCode, staffAuthHeader);
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
    if (!staffAuthHeader) {
      setFacilitatorActionError('Нужно заново войти под учётной записью ведущего.');
      return;
    }

    setFacilitatorActionCode(sessionCode);
    setFacilitatorActionError('');

    try {
      await finishGameSession(sessionCode, staffAuthHeader);
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
    if (!staffAuthHeader) {
      setFacilitatorActionError('Нужно заново войти под учётной записью ведущего.');
      return;
    }

    const shouldDelete = window.confirm(
      `Удалить сессию ${sessionCode} вместе с её участниками?`,
    );

    if (!shouldDelete) {
      return;
    }

    setFacilitatorActionCode(sessionCode);
    setFacilitatorActionError('');

    try {
      await deleteGameSession(sessionCode, staffAuthHeader);
      await loadSessions(staffAuthHeader);

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
    setStaffAuthHeader('');
    setFacilitatorSessionCode('');
    setFacilitatorActionCode('');
    setFacilitatorActionError('');
    setFacilitatorSetupLoading(false);
    setFacilitatorRandomRoleLoading(false);
    setFacilitatorRoleParticipantId(null);
    setStaffError('');
    setStaffForm((current) => ({ ...current, password: '' }));
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
            setupLoading={facilitatorSetupLoading}
            randomAssignmentLoading={facilitatorRandomRoleLoading}
            roleAssignmentParticipantId={facilitatorRoleParticipantId}
            error={facilitatorError}
            session={overviewState.session}
            sessions={sessionsState.sessions}
            onSessionCodeChange={setFacilitatorSessionCode}
            onLookupSession={handleLookupSession}
            onRefresh={handleRefreshSession}
            onRefreshSessions={handleRefreshSessions}
            onOpenSession={handleOpenSession}
            onSaveStages={handleSaveStages}
            onAssignRandomRoles={handleAssignRandomRoles}
            onAssignManualRole={handleAssignManualRole}
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
