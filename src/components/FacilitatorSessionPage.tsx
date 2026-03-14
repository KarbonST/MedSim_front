import type { ChangeEvent, FormEvent } from 'react';
import BrandHeader from './BrandHeader';
import type {
  GameSessionParticipantsResponse,
  GameSessionSummary,
} from '../types/app';

interface FacilitatorSessionPageProps {
  login: string;
  sessionCode: string;
  loading: boolean;
  sessionsLoading: boolean;
  actionSessionCode: string;
  error: string;
  session: GameSessionParticipantsResponse | null;
  sessions: GameSessionSummary[];
  onSessionCodeChange: (value: string) => void;
  onLookupSession: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onRefresh: () => void | Promise<void>;
  onRefreshSessions: () => void | Promise<void>;
  onOpenSession: (sessionCode: string) => void | Promise<void>;
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
  actionSessionCode,
  error,
  session,
  sessions,
  onSessionCodeChange,
  onLookupSession,
  onRefresh,
  onRefreshSessions,
  onOpenSession,
  onStartSession,
  onFinishSession,
  onDeleteSession,
  onBack,
}: FacilitatorSessionPageProps) {
  const handleSessionCodeChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onSessionCodeChange(event.target.value);
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
            <p>Сессий пока нет. Они появятся после подключения игроков.</p>
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
          </div>

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
