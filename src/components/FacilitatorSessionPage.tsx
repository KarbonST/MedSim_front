import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type {
  GameSessionParticipantsResponse,
  GameSessionStageSettingsRequest,
  GameSessionSummary,
  SessionStageSetting,
} from '../types/app';
import BrandHeader from './BrandHeader';
import { getSessionStatusLabel } from '../constants/sessionStatuses';
import { formatRuntimeDuration, getInteractionModeLabel, getRuntimeRemainingSeconds, getTimerStatusLabel } from '../lib/sessionRuntime';
import FacilitatorLiveDashboard from './FacilitatorLiveDashboard';
import SessionSetupPanel from './SessionSetupPanel';

interface FacilitatorSessionPageProps {
  login: string;
  loading: boolean;
  sessionsLoading: boolean;
  creatingSession: boolean;
  renamingSession: boolean;
  autoTeamAssignmentLoading: boolean;
  teamRenameId: number | null;
  teamAssignmentParticipantId: number | null;
  actionSessionCode: string;
  setupLoading: boolean;
  randomAssignmentLoading: boolean;
  roleAssignmentParticipantId: number | null;
  error: string;
  session: GameSessionParticipantsResponse | null;
  sessions: GameSessionSummary[];
  onRefreshSessions: () => void | Promise<void>;
  onCreateSession: (sessionName: string, teamCount: number) => Promise<boolean>;
  onRenameSession: (sessionCode: string, sessionName: string) => Promise<boolean>;
  onOpenSession: (sessionCode: string) => void | Promise<void>;
  onRenameTeam: (
    sessionCode: string,
    teamId: number,
    teamName: string,
  ) => void | Promise<void>;
  onAutoAssignTeams: (sessionCode: string) => void | Promise<void>;
  onAssignParticipantTeam: (
    sessionCode: string,
    participantId: number,
    teamId: number,
  ) => void | Promise<void>;
  onSaveStages: (
    sessionCode: string,
    request: GameSessionStageSettingsRequest,
  ) => void | Promise<void>;
  onAssignRandomRoles: (sessionCode: string) => void | Promise<void>;
  onAssignManualRole: (
    sessionCode: string,
    participantId: number,
    gameRole: string,
  ) => void | Promise<void>;
  onSelectRuntimeStage: (sessionCode: string, stageNumber: number) => void | Promise<void>;
  onStartRuntimeTimer: (sessionCode: string) => void | Promise<void>;
  onPauseRuntimeTimer: (sessionCode: string) => void | Promise<void>;
  onResetRuntimeTimer: (sessionCode: string) => void | Promise<void>;
  onSelectRuntimeStage: (sessionCode: string, stageNumber: number) => void | Promise<void>;
  onStartRuntimeTimer: (sessionCode: string) => void | Promise<void>;
  onPauseRuntimeTimer: (sessionCode: string) => void | Promise<void>;
  onResetRuntimeTimer: (sessionCode: string) => void | Promise<void>;
  onStartSession: (sessionCode: string) => void | Promise<void>;
  onPauseSession: (sessionCode: string) => void | Promise<void>;
  onFinishSession: (sessionCode: string) => void | Promise<void>;
  onDeleteSession: (sessionCode: string) => void | Promise<void>;
  onBack: () => void;
}

interface SessionControlPanelProps {
  session: GameSessionParticipantsResponse;
  actionSessionCode: string;
  onSelectRuntimeStage: (sessionCode: string, stageNumber: number) => void | Promise<void>;
  onStartRuntimeTimer: (sessionCode: string) => void | Promise<void>;
  onPauseRuntimeTimer: (sessionCode: string) => void | Promise<void>;
  onResetRuntimeTimer: (sessionCode: string) => void | Promise<void>;
  onStartSession: (sessionCode: string) => void | Promise<void>;
  onPauseSession: (sessionCode: string) => void | Promise<void>;
  onFinishSession: (sessionCode: string) => void | Promise<void>;
}

function sortStages(stages: SessionStageSetting[]): SessionStageSetting[] {
  return [...stages].sort((left, right) => left.stageNumber - right.stageNumber);
}

function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(totalSeconds, 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function SessionControlPanel({
  session,
  actionSessionCode,
  onSelectRuntimeStage,
  onStartRuntimeTimer,
  onPauseRuntimeTimer,
  onResetRuntimeTimer,
  onStartSession,
  onPauseSession,
  onFinishSession,
}: SessionControlPanelProps) {
  const stages = useMemo(() => sortStages(session.stages), [session.stages]);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (session.sessionRuntime.timerStatus !== 'RUNNING') {
      return;
    }

    setNowMs(Date.now());
    const timerId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [session.sessionRuntime.timerStatus, session.sessionRuntime.timerEndsAt]);

  const currentStageNumber = session.sessionRuntime.activeStageNumber ?? stages[0]?.stageNumber ?? null;
  const currentStage = stages.find((stage) => stage.stageNumber === currentStageNumber) ?? stages[0] ?? null;
  const remainingSeconds = getRuntimeRemainingSeconds(session.sessionRuntime, nowMs);
  const isActionPending = actionSessionCode === session.sessionCode;
  const hasSavedStages = stages.length > 0;
  const leadershipRoles = ['Главный врач', 'Главная медсестра', 'Главный инженер'];
  const unassignedParticipantsCount = session.participants.filter((participant) => participant.teamId == null).length;
  const teamsMissingLeadership = session.teams
    .map((team) => {
      const teamRoles = session.participants
        .filter((participant) => participant.teamId === team.teamId)
        .map((participant) => participant.gameRole)
        .filter((role): role is string => Boolean(role));
      const missingLeadershipRoles = leadershipRoles.filter(
        (role) => !teamRoles.some((assignedRole) => assignedRole.toLowerCase() === role.toLowerCase()),
      );

      return {
        teamName: team.teamName,
        missingLeadershipRoles,
      };
    })
    .filter((team) => team.missingLeadershipRoles.length > 0);
  const canStartGame =
    (session.sessionStatus === 'LOBBY'
      && hasSavedStages
      && unassignedParticipantsCount === 0
      && teamsMissingLeadership.length === 0)
    || session.sessionStatus === 'PAUSED';
  const canPauseGame = session.sessionStatus === 'IN_PROGRESS';
  const canFinishGame = session.sessionStatus === 'IN_PROGRESS' || session.sessionStatus === 'PAUSED';
  const shouldShowTimerTools = session.sessionStatus !== 'LOBBY';
  const isRunning = session.sessionStatus === 'IN_PROGRESS';
  const startButtonLabel = session.sessionStatus === 'PAUSED' ? 'Продолжить игру' : 'Начать игру';
  const startPendingLabel = session.sessionStatus === 'PAUSED' ? 'Возобновление...' : 'Запуск...';

  return (
    <div className="participants-panel session-control-panel">
      <div className="participants-panel-header">
        <div>
          <p className="section-kicker">Управление сессией</p>
          <h3>Таймер, этапы и запуск игры</h3>
        </div>
        <span className="status-pill subtle-status-pill">Статус: {getSessionStatusLabel(session.sessionStatus)}</span>
      </div>

      <div className="waiting-note">
        <p>
          Здесь отображается общий этап игры и единый таймер сессии. Тот же этап и тот же отсчёт будут видны участникам на командных экранах.
        </p>
      </div>

      <div className={shouldShowTimerTools ? 'session-control-grid' : 'session-control-grid session-control-grid--compact'}>
        {shouldShowTimerTools ? (
          <article className="info-card session-control-timer-card">
            <span>Текущий этап</span>
            <strong className="stage-timer-display">{formatRuntimeDuration(remainingSeconds)}</strong>
            <p className="participant-role-subtitle">
              {currentStage
                ? `Этап ${currentStage.stageNumber}: ${getInteractionModeLabel(session.sessionRuntime.activeStageInteractionMode)}`
                : 'Сначала настройте этапы сессии'}
            </p>
            <span className="status-pill subtle-status-pill runtime-status-pill">
              {getTimerStatusLabel(session.sessionRuntime.timerStatus)}
            </span>
          </article>
        ) : null}

        <div className="session-control-actions-card">
          <div className="session-control-actions-block">
            <span className="section-kicker">Этапы</span>
            <div className="stage-selector-row">
              {stages.length ? (
                stages.map((stage) => {
                  const isSelected = stage.stageNumber === currentStage?.stageNumber;
                  return (
                    <button
                      key={stage.stageNumber}
                      type="button"
                      className={isSelected ? 'stage-selector-button active' : 'stage-selector-button'}
                      onClick={() => onSelectRuntimeStage(session.sessionCode, stage.stageNumber)}
                      disabled={isActionPending}
                    >
                      Этап {stage.stageNumber}
                    </button>
                  );
                })
              ) : (
                <p className="participant-role-subtitle">Этапы пока не настроены.</p>
              )}
            </div>
          </div>

          {shouldShowTimerTools ? (
            <div className="session-control-actions-block">
              <span className="section-kicker">Таймер</span>
              <div className="session-control-actions-row">
                <button
                  type="button"
                  className="primary-button compact-button"
                  onClick={() => onStartRuntimeTimer(session.sessionCode)}
                  disabled={!currentStage || session.sessionRuntime.timerStatus === 'RUNNING' || remainingSeconds === 0 || !isRunning || isActionPending}
                >
                  {isActionPending && session.sessionRuntime.timerStatus !== 'RUNNING' ? 'Запуск...' : 'Пуск таймера'}
                </button>
                <button
                  type="button"
                  className="secondary-button compact-button"
                  onClick={() => onPauseRuntimeTimer(session.sessionCode)}
                  disabled={session.sessionRuntime.timerStatus !== 'RUNNING' || isActionPending}
                >
                  {isActionPending && session.sessionRuntime.timerStatus === 'RUNNING' ? 'Пауза...' : 'Пауза таймера'}
                </button>
                <button
                  type="button"
                  className="secondary-button compact-button"
                  onClick={() => onResetRuntimeTimer(session.sessionCode)}
                  disabled={!currentStage || isActionPending}
                >
                  {isActionPending ? 'Сброс...' : 'Сбросить'}
                </button>
              </div>
            </div>
          ) : null}

          <div className="session-control-actions-block">
            <span className="section-kicker">Игра</span>
            {!hasSavedStages ? (
              <p className="participant-role-subtitle">
                Сначала настройте и сохраните этапы, затем игру можно будет начать.
              </p>
            ) : null}
            {hasSavedStages && unassignedParticipantsCount > 0 ? (
              <p className="participant-role-subtitle">
                Перед стартом распределите по командам всех игроков. Без команды сейчас: {unassignedParticipantsCount}.
              </p>
            ) : null}
            {hasSavedStages && teamsMissingLeadership.length > 0 ? (
              <p className="participant-role-subtitle">
                Перед стартом в каждой команде должны быть назначены роли главного врача, главной медсестры и главного
                инженера. Сейчас не хватает: {teamsMissingLeadership.map((team) => `${team.teamName} (${team.missingLeadershipRoles.join(', ')})`).join('; ')}.
              </p>
            ) : null}
            <div className="session-control-actions-row">
              <button
                type="button"
                className="primary-button compact-button"
                onClick={() => onStartSession(session.sessionCode)}
                disabled={!canStartGame || isActionPending}
              >
                {isActionPending && canStartGame ? startPendingLabel : startButtonLabel}
              </button>
              <button
                type="button"
                className="secondary-button compact-button"
                onClick={() => onPauseSession(session.sessionCode)}
                disabled={!canPauseGame || isActionPending}
              >
                {isActionPending && canPauseGame ? 'Пауза...' : 'Приостановить игру'}
              </button>
              <button
                type="button"
                className="secondary-button finish-button compact-button"
                onClick={() => onFinishSession(session.sessionCode)}
                disabled={!canFinishGame || isActionPending}
              >
                {isActionPending && canFinishGame ? 'Завершение...' : 'Завершить игру'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FacilitatorSessionPage({
  login,
  loading,
  sessionsLoading,
  creatingSession,
  renamingSession,
  autoTeamAssignmentLoading,
  teamRenameId,
  teamAssignmentParticipantId,
  actionSessionCode,
  setupLoading,
  randomAssignmentLoading,
  roleAssignmentParticipantId,
  error,
  session,
  sessions,
  onRefreshSessions,
  onCreateSession,
  onRenameSession,
  onOpenSession,
  onRenameTeam,
  onAutoAssignTeams,
  onAssignParticipantTeam,
  onSaveStages,
  onAssignRandomRoles,
  onAssignManualRole,
  onSelectRuntimeStage,
  onStartRuntimeTimer,
  onPauseRuntimeTimer,
  onResetRuntimeTimer,
  onStartSession,
  onPauseSession,
  onFinishSession,
  onDeleteSession,
  onBack,
}: FacilitatorSessionPageProps) {
  const [creationName, setCreationName] = useState('');
  const [creationTeamCount, setCreationTeamCount] = useState('2');
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    setRenameValue(session?.sessionName ?? '');
  }, [session?.sessionCode, session?.sessionName]);

  const handleCreateSession = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const sessionName = creationName.trim();
    const teamCount = Number.parseInt(creationTeamCount, 10);

    if (!sessionName || Number.isNaN(teamCount)) {
      return;
    }

    const created = await onCreateSession(sessionName, teamCount);

    if (created) {
      setCreationName('');
      setCreationTeamCount('2');
    }
  };

  const handleRenameSession = async (): Promise<void> => {
    if (!session) {
      return;
    }

    const trimmedName = renameValue.trim();

    if (!trimmedName || trimmedName === session.sessionName) {
      return;
    }

    const renamed = await onRenameSession(session.sessionCode, trimmedName);

    if (renamed) {
      setRenameValue(trimmedName);
    }
  };

  const isLobby = session?.sessionStatus === 'LOBBY';

  return (
    <section className="session-room facilitator-room">
      <BrandHeader
        compact
        eyebrow="Панель ведущего"
        title={isLobby ? 'Контроль стартовой комнаты' : 'Мониторинг запущенной игры'}
      />

      <div className="room-hero">
        <div>
          <p className="section-kicker">Активный профиль</p>
          <h2>{login}</h2>
        </div>
        <span className="status-pill">Ведущий</span>
      </div>

      <div className="participants-panel session-create-panel">
        <div className="participants-panel-header">
          <div>
            <p className="section-kicker">Новая сессия</p>
            <h3>Создание игровой комнаты</h3>
          </div>
        </div>

        <form className="session-create-form" onSubmit={handleCreateSession}>
          <label className="field">
            <span>Название сессии</span>
            <input
              type="text"
              placeholder="Например, Приёмное отделение"
              value={creationName}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setCreationName(event.target.value)}
            />
          </label>

          <label className="field compact-field team-count-creation-field">
            <span>Количество команд</span>
            <input
              type="number"
              min="2"
              max="12"
              value={creationTeamCount}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setCreationTeamCount(event.target.value)}
            />
          </label>

          <button
            type="submit"
            className="primary-button"
            disabled={creatingSession || !creationName.trim()}
          >
            {creatingSession ? 'Создание...' : 'Создать сессию'}
          </button>
        </form>

        <div className="waiting-note compact-note">
          <p>
            Укажите название и количество команд. Код сессии и стартовые названия сформируются автоматически. После создания станут доступны распределение игроков, настройка этапов и назначение ролей.
          </p>
        </div>
      </div>

      <div className="participants-panel sessions-board">
        <div className="participants-panel-header">
          <div>
            <p className="section-kicker">Активные сессии</p>
            <h3>Управление игровыми комнатами</h3>
          </div>

          <button type="button" className="secondary-button" onClick={onRefreshSessions}>
            {sessionsLoading ? 'Обновление...' : 'Обновить сессии'}
          </button>
        </div>

        {sessions.length ? (
          <div className="session-cards">
            {sessions.map((sessionItem) => {
              const isActionPending = actionSessionCode === sessionItem.sessionCode;
              const isSelected = session?.sessionCode === sessionItem.sessionCode;

              return (
                <article
                  key={sessionItem.sessionId}
                  className={isSelected ? 'session-card selected session-card--interactive' : 'session-card session-card--interactive'}
                  onClick={() => {
                    void onOpenSession(sessionItem.sessionCode);
                  }}
                >
                  <div className="session-card-header">
                    <div className="session-card-title">
                      <strong>{sessionItem.sessionName}</strong>
                      <span>{sessionItem.sessionCode}</span>
                    </div>
                    <span className="status-pill session-status-pill">{getSessionStatusLabel(sessionItem.sessionStatus)}</span>
                  </div>

                  <div className="session-card-metrics">
                    <span>Игроков: {sessionItem.participantCount}</span>
                    <span>Команд: {sessionItem.teamCount}</span>
                    <span>Этапов: {sessionItem.stageCount}</span>
                  </div>

                  <div className="session-card-actions session-card-actions--two" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      className="primary-button compact-button"
                      onClick={() => onOpenSession(sessionItem.sessionCode)}
                    >
                      {isSelected ? 'Открыта' : 'Перейти'}
                    </button>
                    <button
                      type="button"
                      className="danger-button compact-button"
                      onClick={() => onDeleteSession(sessionItem.sessionCode)}
                      disabled={isActionPending}
                    >
                      {isActionPending ? 'Удаление...' : 'Удалить'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="waiting-note facilitator-empty-state">
            <p>Создайте первую игровую комнату, чтобы перейти к настройке команд, этапов и ролей.</p>
          </div>
        )}
      </div>

      {session ? (
        <div className="participants-panel session-rename-inline-panel">
          <div className="participants-panel-header">
            <div>
              <p className="section-kicker">Активная сессия</p>
              <h3>{isLobby ? 'Название и состояние комнаты' : 'Состояние запущенной игры'}</h3>
            </div>
          </div>

          <div className="room-grid facilitator-summary-grid">
            <article className="info-card">
              <span>Сессия</span>
              <strong>{session.sessionName}</strong>
            </article>
            <article className="info-card">
              <span>Код</span>
              <strong>{session.sessionCode}</strong>
            </article>
            <article className="info-card">
              <span>Статус</span>
              <strong>{getSessionStatusLabel(session.sessionStatus)}</strong>
            </article>
            <article className="info-card">
              <span>Участники</span>
              <strong>{session.participants.length}</strong>
            </article>
            <article className="info-card">
              <span>Команды</span>
              <strong>{session.teams.length}</strong>
            </article>
            <article className="info-card">
              <span>Этапы</span>
              <strong>{session.stages.length}</strong>
            </article>
          </div>

          <div className="session-rename-inline-form">
            <label className="field session-lookup-name-field">
              <span>Название сессии</span>
              <input
                type="text"
                placeholder="Введите новое название сессии"
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                disabled={renamingSession}
              />
            </label>

            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                void handleRenameSession();
              }}
              disabled={renamingSession || !renameValue.trim() || renameValue.trim() === session.sessionName}
            >
              {renamingSession ? 'Сохранение...' : 'Сохранить название'}
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}

      {session ? (
        isLobby ? (
          <>
            <SessionSetupPanel
              session={session}
              loading={loading}
              autoTeamAssignmentLoading={autoTeamAssignmentLoading}
              randomAssignmentLoading={randomAssignmentLoading}
              savingStages={setupLoading}
              teamRenameId={teamRenameId}
              teamAssignmentParticipantId={teamAssignmentParticipantId}
              roleAssignmentParticipantId={roleAssignmentParticipantId}
              onRenameTeam={onRenameTeam}
              onAutoAssignTeams={onAutoAssignTeams}
              onAssignParticipantTeam={onAssignParticipantTeam}
              onSaveStages={onSaveStages}
              onAssignRandomRoles={onAssignRandomRoles}
              onAssignManualRole={onAssignManualRole}
            />
            <SessionControlPanel
              session={session}
              actionSessionCode={actionSessionCode}
              onSelectRuntimeStage={onSelectRuntimeStage}
              onStartRuntimeTimer={onStartRuntimeTimer}
              onPauseRuntimeTimer={onPauseRuntimeTimer}
              onResetRuntimeTimer={onResetRuntimeTimer}
              onStartSession={onStartSession}
              onPauseSession={onPauseSession}
              onFinishSession={onFinishSession}
            />
          </>
        ) : (
          <>
            <FacilitatorLiveDashboard session={session} loading={loading} />
            <SessionControlPanel
              session={session}
              actionSessionCode={actionSessionCode}
              onSelectRuntimeStage={onSelectRuntimeStage}
              onStartRuntimeTimer={onStartRuntimeTimer}
              onPauseRuntimeTimer={onPauseRuntimeTimer}
              onResetRuntimeTimer={onResetRuntimeTimer}
              onStartSession={onStartSession}
              onPauseSession={onPauseSession}
              onFinishSession={onFinishSession}
            />
          </>
        )
      ) : (
        <div className="waiting-note facilitator-empty-state">
          <p>
            Выберите сессию из списка выше. После этого станут доступны настройка команд, этапов и ролей, а затем и мониторинг игры.
          </p>
        </div>
      )}

      <button type="button" className="secondary-button back-button" onClick={onBack}>
        Вернуться ко входу
      </button>
    </section>
  );
}

export default FacilitatorSessionPage;
