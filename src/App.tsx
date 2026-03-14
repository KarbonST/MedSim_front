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
import { useAvailablePlayerSessions } from './hooks/useAvailablePlayerSessions';
import { useFacilitatorSessionOverview } from './hooks/useFacilitatorSessionOverview';
import { useGameSessionsList } from './hooks/useGameSessionsList';
import { usePlayerSession } from './hooks/usePlayerSession';
import {
  readPersistedAppState,
  writePersistedAppState,
} from './lib/persistence';
import {
  assignManualGameRole,
  assignParticipantTeam,
  assignRandomGameRoles,
  autoAssignTeams,
  createGameSession,
  deleteGameSession,
  finishGameSession,
  renameGameSession,
  renameGameSessionTeam,
  saveGameSessionStages,
  startGameSession,
} from './services/gameSessionsApi';
import { createBasicAuthHeader, fetchStaffProfile } from './services/staffAuthApi';
import type {
  GameSessionStageSettingsRequest,
  Mode,
  PlayerFormState,
  StaffFormState,
} from './types/app';

function App() {
  const [persistedState] = useState(() => readPersistedAppState());
  const [mode, setMode] = useState<Mode>(persistedState.mode);
  const [playerForm, setPlayerForm] = useState<PlayerFormState>({
    name: persistedState.playerForm.name,
    hospitalRole: persistedState.playerForm.hospitalRole || playerRoles[0],
    sessionCode: persistedState.playerForm.sessionCode,
  });
  const [staffForm, setStaffForm] = useState<StaffFormState>({
    profile: persistedState.staff.profile || accessProfiles[0].id,
    login: persistedState.staff.login,
    password: '',
  });
  const [staffError, setStaffError] = useState('');
  const [staffAuthHeader, setStaffAuthHeader] = useState(
    persistedState.facilitator.authHeader,
  );
  const [facilitatorSessionCode, setFacilitatorSessionCode] = useState(
    persistedState.facilitator.sessionCode,
  );
  const [facilitatorActionCode, setFacilitatorActionCode] = useState('');
  const [facilitatorActionError, setFacilitatorActionError] = useState('');
  const [facilitatorSetupLoading, setFacilitatorSetupLoading] = useState(false);
  const [facilitatorAutoTeamLoading, setFacilitatorAutoTeamLoading] = useState(false);
  const [facilitatorRandomRoleLoading, setFacilitatorRandomRoleLoading] = useState(false);
  const [facilitatorRoleParticipantId, setFacilitatorRoleParticipantId] = useState<number | null>(null);
  const [facilitatorTeamRenameId, setFacilitatorTeamRenameId] = useState<number | null>(null);
  const [facilitatorTeamParticipantId, setFacilitatorTeamParticipantId] = useState<number | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [renamingSession, setRenamingSession] = useState(false);
  const [isFacilitatorWorkspaceOpen, setIsFacilitatorWorkspaceOpen] = useState(
    persistedState.facilitator.isWorkspaceOpen && Boolean(persistedState.facilitator.authHeader),
  );
  const { joinState, joinSession, resetSession } = usePlayerSession(
    persistedState.playerSession,
  );
  const { availableSessionsState, loadAvailableSessions, resetAvailableSessions } =
    useAvailablePlayerSessions();
  const { overviewState, loadSession, resetOverview } = useFacilitatorSessionOverview();
  const { sessionsState, loadSessions, resetSessions } = useGameSessionsList();

  useEffect(() => {
    writePersistedAppState({
      mode,
      playerForm,
      playerSession: joinState.session,
      staff: {
        profile: staffForm.profile,
        login: staffForm.login.trim(),
      },
      facilitator: {
        authHeader: staffAuthHeader,
        isWorkspaceOpen: isFacilitatorWorkspaceOpen,
        sessionCode: facilitatorSessionCode,
      },
    });
  }, [
    mode,
    playerForm,
    joinState.session,
    staffForm.profile,
    staffForm.login,
    staffAuthHeader,
    isFacilitatorWorkspaceOpen,
    facilitatorSessionCode,
  ]);

  useEffect(() => {
    if (mode !== 'player' || joinState.session) {
      return;
    }

    void loadAvailableSessions();
  }, [mode, joinState.session]);

  useEffect(() => {
    if (
      joinState.session
      || !playerForm.sessionCode
      || availableSessionsState.loading
      || availableSessionsState.error
    ) {
      return;
    }

    const sessionStillAvailable = availableSessionsState.sessions.some(
      (session) => session.sessionCode === playerForm.sessionCode,
    );

    if (!sessionStillAvailable) {
      setPlayerForm((current) => ({ ...current, sessionCode: '' }));
    }
  }, [
    joinState.session,
    playerForm.sessionCode,
    availableSessionsState.loading,
    availableSessionsState.error,
    availableSessionsState.sessions,
  ]);

  useEffect(() => {
    if (!isFacilitatorWorkspaceOpen || !staffAuthHeader) {
      return;
    }

    void loadSessions(staffAuthHeader);
  }, [isFacilitatorWorkspaceOpen, staffAuthHeader]);

  useEffect(() => {
    if (!isFacilitatorWorkspaceOpen || !staffAuthHeader || !facilitatorSessionCode.trim()) {
      return;
    }

    void loadSession(facilitatorSessionCode, staffAuthHeader);
  }, [isFacilitatorWorkspaceOpen, staffAuthHeader, facilitatorSessionCode]);

  useEffect(() => {
    if (!isFacilitatorWorkspaceOpen || !staffAuthHeader) {
      return;
    }

    let isCancelled = false;

    const restoreFacilitatorProfile = async (): Promise<void> => {
      try {
        const profile = await fetchStaffProfile(staffAuthHeader);

        if (profile.systemRole !== 'FACILITATOR') {
          throw new Error('Эта учётная запись не относится к ведущему.');
        }
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setStaffError(
          error instanceof Error
            ? error.message
            : 'Нужно заново войти под учётной записью ведущего.',
        );
        setStaffAuthHeader('');
        setIsFacilitatorWorkspaceOpen(false);
        setFacilitatorSessionCode('');
        resetOverview();
        resetSessions();
      }
    };

    void restoreFacilitatorProfile();

    return () => {
      isCancelled = true;
    };
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
      setMode('staff');
      setStaffAuthHeader(authHeader);
      setIsFacilitatorWorkspaceOpen(true);
    } catch (error) {
      setStaffError(error instanceof Error ? error.message : 'Не удалось выполнить вход.');
    }
  };

  const handleRefreshSessions = async (): Promise<void> => {
    if (!staffAuthHeader) {
      setFacilitatorActionError('Нужно заново войти под учётной записью ведущего.');
      return;
    }

    setFacilitatorActionError('');
    await Promise.all([loadSessions(staffAuthHeader), loadAvailableSessions()]);
  };

  const syncAfterSessionMutation = async (sessionCode: string): Promise<void> => {
    if (!staffAuthHeader) {
      setFacilitatorActionError('Нужно заново войти под учётной записью ведущего.');
      return;
    }

    await Promise.all([
      loadSessions(staffAuthHeader),
      loadSession(sessionCode, staffAuthHeader),
      loadAvailableSessions(),
    ]);
  };

  const handleCreateSession = async (
    sessionName: string,
    teamCount: number,
  ): Promise<boolean> => {
    if (!staffAuthHeader) {
      setFacilitatorActionError('Нужно заново войти под учётной записью ведущего.');
      return false;
    }

    setCreatingSession(true);
    setFacilitatorActionError('');

    try {
      const createdSession = await createGameSession(
        {
          sessionName,
          teamCount,
        },
        staffAuthHeader,
      );

      setFacilitatorSessionCode(createdSession.sessionCode);
      await Promise.all([
        loadSessions(staffAuthHeader),
        loadSession(createdSession.sessionCode, staffAuthHeader),
        loadAvailableSessions(),
      ]);
      return true;
    } catch (error) {
      setFacilitatorActionError(
        error instanceof Error ? error.message : 'Не удалось создать игровую сессию.',
      );
      return false;
    } finally {
      setCreatingSession(false);
    }
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

  const handleRenameSession = async (
    sessionCode: string,
    sessionName: string,
  ): Promise<boolean> => {
    if (!staffAuthHeader) {
      setFacilitatorActionError('Нужно заново войти под учётной записью ведущего.');
      return false;
    }

    setFacilitatorActionError('');
    setRenamingSession(true);

    try {
      await renameGameSession(sessionCode, { sessionName }, staffAuthHeader);
      await syncAfterSessionMutation(sessionCode);
      return true;
    } catch (error) {
      setFacilitatorActionError(
        error instanceof Error ? error.message : 'Не удалось переименовать сессию.',
      );
      return false;
    } finally {
      setRenamingSession(false);
    }
  };

  const handleRenameTeam = async (
    sessionCode: string,
    teamId: number,
    teamName: string,
  ): Promise<void> => {
    if (!staffAuthHeader) {
      setFacilitatorActionError('Нужно заново войти под учётной записью ведущего.');
      return;
    }

    setFacilitatorActionError('');
    setFacilitatorTeamRenameId(teamId);

    try {
      await renameGameSessionTeam(sessionCode, teamId, { teamName }, staffAuthHeader);
      await syncAfterSessionMutation(sessionCode);
    } catch (error) {
      setFacilitatorActionError(
        error instanceof Error ? error.message : 'Не удалось переименовать команду.',
      );
    } finally {
      setFacilitatorTeamRenameId(null);
    }
  };

  const handleAutoAssignTeams = async (sessionCode: string): Promise<void> => {
    if (!staffAuthHeader) {
      setFacilitatorActionError('Нужно заново войти под учётной записью ведущего.');
      return;
    }

    setFacilitatorActionError('');
    setFacilitatorAutoTeamLoading(true);

    try {
      await autoAssignTeams(sessionCode, staffAuthHeader);
      await syncAfterSessionMutation(sessionCode);
    } catch (error) {
      setFacilitatorActionError(
        error instanceof Error ? error.message : 'Не удалось автоматически распределить игроков по командам.',
      );
    } finally {
      setFacilitatorAutoTeamLoading(false);
    }
  };

  const handleAssignParticipantTeam = async (
    sessionCode: string,
    participantId: number,
    teamId: number,
  ): Promise<void> => {
    if (!staffAuthHeader) {
      setFacilitatorActionError('Нужно заново войти под учётной записью ведущего.');
      return;
    }

    setFacilitatorActionError('');
    setFacilitatorTeamParticipantId(participantId);

    try {
      await assignParticipantTeam(sessionCode, participantId, { teamId }, staffAuthHeader);
      await syncAfterSessionMutation(sessionCode);
    } catch (error) {
      setFacilitatorActionError(
        error instanceof Error ? error.message : 'Не удалось назначить команду участнику.',
      );
    } finally {
      setFacilitatorTeamParticipantId(null);
    }
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
      `Удалить сессию ${sessionCode} вместе с её участниками и командами?`,
    );

    if (!shouldDelete) {
      return;
    }

    setFacilitatorActionCode(sessionCode);
    setFacilitatorActionError('');

    try {
      await deleteGameSession(sessionCode, staffAuthHeader);
      await Promise.all([loadSessions(staffAuthHeader), loadAvailableSessions()]);

      if (
        overviewState.session?.sessionCode === sessionCode
        || facilitatorSessionCode === sessionCode
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
    void loadAvailableSessions();
  };

  const handleCloseFacilitatorWorkspace = (): void => {
    setIsFacilitatorWorkspaceOpen(false);
    setStaffAuthHeader('');
    setFacilitatorSessionCode('');
    setFacilitatorActionCode('');
    setFacilitatorActionError('');
    setFacilitatorSetupLoading(false);
    setFacilitatorAutoTeamLoading(false);
    setFacilitatorRandomRoleLoading(false);
    setFacilitatorRoleParticipantId(null);
    setFacilitatorTeamRenameId(null);
    setFacilitatorTeamParticipantId(null);
    setCreatingSession(false);
    setRenamingSession(false);
    setStaffError('');
    setStaffForm((current) => ({ ...current, password: '' }));
    resetOverview();
    resetSessions();
    resetAvailableSessions();
  };

  const handleModeChange = (nextMode: Mode): void => {
    setMode(nextMode);
    setStaffError('');
  };

  const playerError = joinState.error || availableSessionsState.error;
  const facilitatorError = facilitatorActionError || overviewState.error || sessionsState.error;

  return (
    <main className="page-shell">
      <section className="form-panel">
        {joinState.session ? (
          <SessionWaitingRoom session={joinState.session} onReset={handleResetPlayerFlow} />
        ) : isFacilitatorWorkspaceOpen ? (
          <FacilitatorSessionPage
            login={staffForm.login.trim()}
            loading={overviewState.loading}
            sessionsLoading={sessionsState.loading}
            creatingSession={creatingSession}
            renamingSession={renamingSession}
            autoTeamAssignmentLoading={facilitatorAutoTeamLoading}
            teamRenameId={facilitatorTeamRenameId}
            teamAssignmentParticipantId={facilitatorTeamParticipantId}
            actionSessionCode={facilitatorActionCode}
            setupLoading={facilitatorSetupLoading}
            randomAssignmentLoading={facilitatorRandomRoleLoading}
            roleAssignmentParticipantId={facilitatorRoleParticipantId}
            error={facilitatorError}
            session={overviewState.session}
            sessions={sessionsState.sessions}
            onRefreshSessions={handleRefreshSessions}
            onCreateSession={handleCreateSession}
            onRenameSession={handleRenameSession}
            onOpenSession={handleOpenSession}
            onRenameTeam={handleRenameTeam}
            onAutoAssignTeams={handleAutoAssignTeams}
            onAssignParticipantTeam={handleAssignParticipantTeam}
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
                availableSessions={availableSessionsState.sessions}
                sessionsLoading={availableSessionsState.loading}
                onChange={updatePlayerForm}
                onRefreshSessions={loadAvailableSessions}
                onSubmit={handlePlayerSubmit}
                loading={joinState.loading}
                error={playerError}
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
