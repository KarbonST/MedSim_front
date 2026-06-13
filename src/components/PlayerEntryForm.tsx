import type { ChangeEvent, FormEvent } from 'react';
import { playerRoles } from '../constants/playerRoles';
import { getSessionStatusLabel } from '../constants/sessionStatuses';
import type { AvailablePlayerSession, PlayerFormState } from '../types/app';

interface PlayerEntryFormProps {
  formState: PlayerFormState;
  availableSessions: AvailablePlayerSession[];
  sessionsLoading: boolean;
  onChange: (field: keyof PlayerFormState, value: string) => void;
  onRefreshSessions: () => void | Promise<void>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  loading: boolean;
  error: string;
}

function PlayerEntryForm({
  formState,
  availableSessions,
  sessionsLoading,
  onChange,
  onRefreshSessions,
  onSubmit,
  loading,
  error,
}: PlayerEntryFormProps) {
  const handleInputChange =
    (field: keyof PlayerFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      onChange(field, event.target.value);
    };

  const selectedSession = availableSessions.find(
    (session) => session.sessionCode === formState.sessionCode,
  );

  return (
    <form className="entry-form" onSubmit={onSubmit}>
      <div className="form-heading">
        <p className="section-kicker">Регистрация участника</p>
        <h2>Подключение к сессии</h2>
        <p>
          Укажите имя, реальную должность и выберите сессию из списка.
        </p>
      </div>

      <div className="participants-panel available-player-sessions-panel">
        <div className="participants-panel-header">
          <div>
            <p className="section-kicker">Доступные сессии</p>
            <h3>Выберите игровую сессию</h3>
          </div>

          <button type="button" className="secondary-button" onClick={onRefreshSessions}>
            {sessionsLoading ? 'Обновление...' : 'Обновить список'}
          </button>
        </div>

        {availableSessions.length ? (
          <div className="session-cards player-available-session-cards">
            {availableSessions.map((session) => {
              const isSelected = session.sessionCode === formState.sessionCode;

              return (
                <button
                  key={session.sessionId}
                  type="button"
                  className={isSelected ? 'session-card selected session-select-card' : 'session-card session-select-card'}
                  onClick={() => onChange('sessionCode', session.sessionCode)}
                >
                  <div className="session-card-header">
                    <div className="session-card-title">
                      <strong>{session.sessionName}</strong>
                      <span>{session.sessionCode}</span>
                    </div>
                    <span className="status-pill session-status-pill">
                      {getSessionStatusLabel(session.sessionStatus)}
                    </span>
                  </div>

                  <div className="session-card-metrics">
                    <span>Игроков внутри: {session.participantCount}</span>
                    {session.sessionStatus !== 'LOBBY' ? (
                      <span>После старта доступен только повторный вход</span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="waiting-note">
            <p>Сейчас нет доступных сессий. Дождитесь, пока ведущий создаст новую комнату.</p>
          </div>
        )}
      </div>

      <label className="field">
        <span>Имя участника</span>
        <input
          type="text"
          placeholder="Например, Анна Петрова"
          value={formState.name}
          onChange={handleInputChange('name')}
        />
      </label>

      <label className="field">
        <span>Реальная должность в больнице</span>
        <select
          value={formState.hospitalRole}
          onChange={handleInputChange('hospitalRole')}
        >
          {playerRoles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </label>

      {selectedSession ? (
        <div className="waiting-note compact-note">
          <p>
            Выбрана сессия <strong>{selectedSession.sessionName}</strong>.
          </p>
          {selectedSession.sessionStatus !== 'LOBBY' ? (
            <p className="waiting-note-inline">
              Если игра уже началась, войти смогут только участники, которые уже подключались к этой сессии под теми же именем и должностью.
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}

      <button className="primary-button" type="submit" disabled={loading || !formState.sessionCode.trim()}>
        {loading ? 'Подключение...' : 'Подключиться к сессии'}
      </button>
    </form>
  );
}

export default PlayerEntryForm;
