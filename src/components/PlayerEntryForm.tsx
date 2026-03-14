import type { ChangeEvent, FormEvent } from 'react';
import { playerRoles } from '../constants/playerRoles';
import type { PlayerFormState } from '../types/app';

interface PlayerEntryFormProps {
  formState: PlayerFormState;
  onChange: (field: keyof PlayerFormState, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  loading: boolean;
  error: string;
}

function PlayerEntryForm({
  formState,
  onChange,
  onSubmit,
  loading,
  error,
}: PlayerEntryFormProps) {
  const handleInputChange =
    (field: keyof PlayerFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      onChange(field, event.target.value);
    };

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
        <span>Код сессии</span>
        <input
          type="text"
          placeholder="Например, WARD-12"
          value={formState.sessionCode}
          onChange={handleInputChange('sessionCode')}
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
