import { playerRoles } from '../constants/playerRoles';

function PlayerEntryForm({ formState, onChange, onSubmit, loading, error }) {
  return (
    <form className="entry-form" onSubmit={onSubmit}>
      <div className="form-heading">
        <p className="section-kicker">Регистрация участника</p>
        <h2>Подключение к сессии</h2>
        <p>
          Укажите имя, должность и код сессии, чтобы попасть в стартовую
          комнату ожидания.
        </p>
      </div>

      <label className="field">
        <span>Имя участника</span>
        <input
          type="text"
          placeholder="Например, Анна Петрова"
          value={formState.name}
          onChange={(event) => onChange('name', event.target.value)}
        />
      </label>

      <label className="field">
        <span>Должность в больнице</span>
        <select
          value={formState.hospitalRole}
          onChange={(event) => onChange('hospitalRole', event.target.value)}
        >
          {playerRoles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Код сессии</span>
        <input
          type="text"
          placeholder="Например, WARD-12"
          value={formState.sessionCode}
          onChange={(event) => onChange('sessionCode', event.target.value)}
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <button className="primary-button" type="submit" disabled={loading}>
        {loading ? 'Подключение...' : 'Подключиться к сессии'}
      </button>
    </form>
  );
}

export default PlayerEntryForm;
