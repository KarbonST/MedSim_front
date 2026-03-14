import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useState } from 'react';
import BrandHeader from './BrandHeader';
import SessionSetupPanel from './SessionSetupPanel';
import type {
  GameSessionParticipantsResponse,
  GameSessionStageSettingsRequest,
  GameSessionSummary,
} from '../types/app';

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
  onStartSession: (sessionCode: string) => void | Promise<void>;
  onFinishSession: (sessionCode: string) => void | Promise<void>;
  onDeleteSession: (sessionCode: string) => void | Promise<void>;
  onBack: () => void;
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
  onStartSession,
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

  return (
    <section className="session-room facilitator-room">
      <BrandHeader
        compact
        eyebrow="Панель ведущего"
        title="Контроль стартовой комнаты"
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
            Код сессии и стартовые названия команд формируются автоматически. После создания комнаты ведущий сможет
            переименовать команды и распределить игроков внутри выбранной сессии.
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
                    <div>
                      <strong>{sessionItem.sessionName}</strong>
                      <span>{sessionItem.sessionCode}</span>
                    </div>
                    <span className="status-pill session-status-pill">{sessionItem.sessionStatus}</span>
                  </div>

                  <div className="session-card-metrics">
                    <span>Игроков: {sessionItem.participantCount}</span>
                    <span>Команд: {sessionItem.teamCount}</span>
                    <span>Этапов: {sessionItem.stageCount}</span>
                  </div>

                  <div className="session-card-actions session-card-actions--three" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      className="primary-button compact-button"
                      onClick={() => onStartSession(sessionItem.sessionCode)}
                      disabled={sessionItem.sessionStatus !== 'LOBBY' || isActionPending}
                    >
                      {isActionPending && sessionItem.sessionStatus === 'LOBBY' ? 'Запуск...' : 'Запустить'}
                    </button>
                    <button
                      type="button"
                      className="secondary-button compact-button finish-button"
                      onClick={() => onFinishSession(sessionItem.sessionCode)}
                      disabled={sessionItem.sessionStatus === 'FINISHED' || isActionPending}
                    >
                      {isActionPending && sessionItem.sessionStatus !== 'LOBBY' ? 'Завершение...' : 'Завершить'}
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
            <p>Сессий пока нет. Сначала создайте игровую комнату вручную.</p>
          </div>
        )}
      </div>

      {session ? (
        <div className="participants-panel session-rename-inline-panel">
          <div className="participants-panel-header">
            <div>
              <p className="section-kicker">Активная сессия</p>
              <h3>Название и состояние комнаты</h3>
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
              <strong>{session.sessionStatus}</strong>
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
      ) : (
        <div className="waiting-note facilitator-empty-state">
          <p>
            Выберите нужную сессию из списка выше, чтобы настроить команды, этапы, роли и изменить название комнаты.
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
