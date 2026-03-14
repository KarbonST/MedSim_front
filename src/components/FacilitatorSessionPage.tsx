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
  sessionCode: string;
  loading: boolean;
  sessionsLoading: boolean;
  creatingSession: boolean;
  renamingSession: boolean;
  actionSessionCode: string;
  setupLoading: boolean;
  randomAssignmentLoading: boolean;
  roleAssignmentParticipantId: number | null;
  error: string;
  session: GameSessionParticipantsResponse | null;
  sessions: GameSessionSummary[];
  onSessionCodeChange: (value: string) => void;
  onLookupSession: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onRefresh: () => void | Promise<void>;
  onRefreshSessions: () => void | Promise<void>;
  onCreateSession: (sessionName: string, sessionCode: string) => Promise<boolean>;
  onRenameSession: (sessionCode: string, sessionName: string) => Promise<boolean>;
  onOpenSession: (sessionCode: string) => void | Promise<void>;
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
  sessionCode,
  loading,
  sessionsLoading,
  creatingSession,
  renamingSession,
  actionSessionCode,
  setupLoading,
  randomAssignmentLoading,
  roleAssignmentParticipantId,
  error,
  session,
  sessions,
  onSessionCodeChange,
  onLookupSession,
  onRefresh,
  onRefreshSessions,
  onCreateSession,
  onRenameSession,
  onOpenSession,
  onSaveStages,
  onAssignRandomRoles,
  onAssignManualRole,
  onStartSession,
  onFinishSession,
  onDeleteSession,
  onBack,
}: FacilitatorSessionPageProps) {
  const [creationForm, setCreationForm] = useState({
    sessionName: '',
    sessionCode: '',
  });
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    setRenameValue(session?.sessionName ?? '');
  }, [session?.sessionCode, session?.sessionName]);

  const handleSessionCodeChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onSessionCodeChange(event.target.value);
  };

  const handleCreationFormChange =
    (field: 'sessionName' | 'sessionCode') =>
    (event: ChangeEvent<HTMLInputElement>): void => {
      setCreationForm((current) => ({ ...current, [field]: event.target.value }));
    };

  const handleCreateSession = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const sessionName = creationForm.sessionName.trim();
    const nextSessionCode = creationForm.sessionCode.trim();

    if (!sessionName || !nextSessionCode) {
      return;
    }

    const created = await onCreateSession(sessionName, nextSessionCode);

    if (created) {
      setCreationForm({
        sessionName: '',
        sessionCode: '',
      });
    }
  };

  const handleRenameSession = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

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

  const hasParticipants = Boolean(session?.participants.length);

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
              value={creationForm.sessionName}
              onChange={handleCreationFormChange('sessionName')}
            />
          </label>

          <label className="field">
            <span>Код сессии</span>
            <input
              type="text"
              placeholder="Например, WARD-12"
              value={creationForm.sessionCode}
              onChange={handleCreationFormChange('sessionCode')}
            />
          </label>

          <button
            type="submit"
            className="primary-button"
            disabled={creatingSession || !creationForm.sessionName.trim() || !creationForm.sessionCode.trim()}
          >
            {creatingSession ? 'Создание...' : 'Создать сессию'}
          </button>
        </form>

        <div className="waiting-note compact-note">
          <p>
            Игроки смогут подключаться только к тем сессиям, которые ведущий создал заранее.
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
                  className={isSelected ? 'session-card selected' : 'session-card'}
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
                    <span>Этапов: {sessionItem.stageCount}</span>
                  </div>

                  <div className="session-card-actions session-card-actions--four">
                    <button
                      type="button"
                      className="secondary-button compact-button"
                      onClick={() => onOpenSession(sessionItem.sessionCode)}
                      disabled={loading || isActionPending}
                    >
                      Открыть
                    </button>
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

      <form className="session-lookup" onSubmit={onLookupSession}>
        <label className="field session-lookup-field">
          <span>Код сессии</span>
          <input
            type="text"
            placeholder="Например, WARD-12"
            value={sessionCode}
            onChange={handleSessionCodeChange}
          />
        </label>

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? 'Загрузка...' : 'Открыть список игроков'}
        </button>
      </form>

      {error ? <p className="form-error">{error}</p> : null}

      {session ? (
        <>
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
              <span>Этапы</span>
              <strong>{session.stages.length}</strong>
            </article>
          </div>

          <div className="participants-panel session-rename-panel">
            <div className="participants-panel-header">
              <div>
                <p className="section-kicker">Название сессии</p>
                <h3>Переименование игровой комнаты</h3>
              </div>
            </div>

            <form className="session-rename-form" onSubmit={handleRenameSession}>
              <label className="field">
                <span>Текущее название</span>
                <input
                  type="text"
                  value={renameValue}
                  onChange={(event) => setRenameValue(event.target.value)}
                  placeholder="Введите новое название сессии"
                />
              </label>

              <button
                type="submit"
                className="secondary-button"
                disabled={renamingSession || !renameValue.trim() || renameValue.trim() === session.sessionName}
              >
                {renamingSession ? 'Сохранение...' : 'Сохранить новое название'}
              </button>
            </form>
          </div>

          <SessionSetupPanel
            session={session}
            loading={loading}
            randomAssignmentLoading={randomAssignmentLoading}
            savingStages={setupLoading}
            roleAssignmentParticipantId={roleAssignmentParticipantId}
            onSaveStages={onSaveStages}
            onAssignRandomRoles={onAssignRandomRoles}
            onAssignManualRole={onAssignManualRole}
          />

          <div className="participants-panel">
            <div className="participants-panel-header">
              <div>
                <p className="section-kicker">Подключившиеся игроки</p>
                <h3>Состав стартовой комнаты</h3>
              </div>

              <button type="button" className="secondary-button" onClick={onRefresh}>
                Обновить список
              </button>
            </div>

            {hasParticipants ? (
              <div className="participants-list">
                {session.participants.map((participant, index) => (
                  <article key={participant.participantId} className="participant-card">
                    <div className="participant-card-header">
                      <span className="participant-index">#{index + 1}</span>
                      <strong>{participant.displayName}</strong>
                    </div>
                    <dl className="participant-details">
                      <div>
                        <dt>Должность</dt>
                        <dd>{participant.hospitalPosition}</dd>
                      </div>
                      <div>
                        <dt>Игровая роль</dt>
                        <dd>{participant.gameRole ?? 'Пока не назначена'}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            ) : (
              <div className="waiting-note">
                <p>В этой сессии пока нет подключившихся игроков.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="waiting-note facilitator-empty-state">
          <p>
            Выберите сессию из списка или введите код вручную, чтобы увидеть
            стартовую комнату и состав участников.
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
