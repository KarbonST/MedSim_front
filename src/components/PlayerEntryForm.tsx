import type { ChangeEvent, FormEvent } from 'react';
import { playerRoles } from '../constants/playerRoles';
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
          Укажите имя, реальную должность и выберите созданную ведущим игровую
          сессию.
        </p>
      </div>

      <div className="participants-panel available-player-sessions-panel">
        <div className="participants-panel-header">
          <div>
            <p className="section-kicker">Доступные сессии</p>
            <h3>Выберите комнату для подключения</h3>
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
                    <div>
                      <strong>{session.sessionName}</strong>
                      <span>{session.sessionCode}</span>
                    </div>
                  </div>

                  <div className="session-card-metrics">
                    <span>Игроков внутри: {session.participantCount}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="waiting-note">
            <p>Сейчас нет доступных сессий. Дождитесь, пока ведущий создаст игровую комнату.</p>
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

      <label className="field">
        <span>Выбранная сессия</span>
        <select
          value={formState.sessionCode}
          onChange={handleInputChange('sessionCode')}
        >
          <option value="">Выберите доступную сессию</option>
          {availableSessions.map((session) => (
            <option key={session.sessionId} value={session.sessionCode}>
              {session.sessionName} ({session.sessionCode})
            </option>
          ))}
        </select>
      </label>

      {selectedSession ? (
        <div className="waiting-note compact-note">
          <p>
            Вы выбрали сессию <strong>{selectedSession.sessionName}</strong> с кодом{' '}
            <strong>{selectedSession.sessionCode}</strong>.
          </p>
        </div>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}

      <button className="primary-button" type="submit" disabled={loading || !formState.sessionCode}>
        {loading ? 'Подключение...' : 'Подключиться к сессии'}
      </button>
    </form>
  );
}

export default PlayerEntryForm;
