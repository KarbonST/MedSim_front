import { useState } from 'react';

const playerRoles = [
  'Главный врач',
  'Главная медсестра',
  'Главный инженер',
  'Медсестра',
  'Заместитель инженера',
];

const accessProfiles = [
  {
    id: 'facilitator',
    label: 'Ведущий',
    hint: 'Управление этапами, таймером, ролями и итогами игры.',
  },
  {
    id: 'superuser',
    label: 'Суперпользователь',
    hint: 'Расширенный доступ к системным настройкам и сценариям.',
  },
];

function App() {
  const [mode, setMode] = useState('player');
  const [playerForm, setPlayerForm] = useState({
    name: '',
    hospitalRole: playerRoles[0],
  });
  const [staffForm, setStaffForm] = useState({
    profile: accessProfiles[0].id,
    login: '',
    password: '',
  });

  const activeProfile =
    accessProfiles.find((profile) => profile.id === staffForm.profile) ?? accessProfiles[0];

  const handlePlayerSubmit = (event) => {
    event.preventDefault();
    console.log('player registration', playerForm);
  };

  const handleStaffSubmit = (event) => {
    event.preventDefault();
    console.log('staff login', staffForm);
  };

  return (
    <main className="page-shell">
      <section className="form-panel">
        <div className="panel-header">
          <div className="brand-mark">MedSim</div>
          <div className="panel-copy">
            <p className="eyebrow">Вход в систему симуляции</p>
            <h1>Регистрация и авторизация</h1>
          </div>
        </div>

        <div className="mode-switch" role="tablist" aria-label="Тип входа">
          <button
            type="button"
            className={mode === 'player' ? 'mode-button active' : 'mode-button'}
            onClick={() => setMode('player')}
          >
            Игрок
          </button>
          <button
            type="button"
            className={mode === 'staff' ? 'mode-button active' : 'mode-button'}
            onClick={() => setMode('staff')}
          >
            Ведущий / суперпользователь
          </button>
        </div>

        {mode === 'player' ? (
          <form className="entry-form" onSubmit={handlePlayerSubmit}>
            <div className="form-heading">
              <p className="section-kicker">Регистрация участника</p>
              <h2>Данные игрока</h2>
              <p>
                Выберите свою реальную должность. Игровую роль ведущий сможет
                выдать отдельно.
              </p>
            </div>

            <label className="field">
              <span>Имя участника</span>
              <input
                type="text"
                placeholder="Например, Анна Петрова"
                value={playerForm.name}
                onChange={(event) =>
                  setPlayerForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>

            <label className="field">
              <span>Должность в больнице</span>
              <select
                value={playerForm.hospitalRole}
                onChange={(event) =>
                  setPlayerForm((current) => ({ ...current, hospitalRole: event.target.value }))
                }
              >
                {playerRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>

            <button className="primary-button" type="submit">
              Перейти к распределению
            </button>
          </form>
        ) : (
          <form className="entry-form" onSubmit={handleStaffSubmit}>
            <div className="form-heading">
              <p className="section-kicker">Служебный вход</p>
              <h2>Авторизация персонала</h2>
              <p>{activeProfile.hint}</p>
            </div>

            <div className="access-cards">
              {accessProfiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  className={staffForm.profile === profile.id ? 'access-card active' : 'access-card'}
                  onClick={() =>
                    setStaffForm((current) => ({ ...current, profile: profile.id }))
                  }
                >
                  <strong>{profile.label}</strong>
                  <span>{profile.hint}</span>
                </button>
              ))}
            </div>

            <label className="field">
              <span>Логин</span>
              <input
                type="text"
                placeholder="Введите логин"
                value={staffForm.login}
                onChange={(event) =>
                  setStaffForm((current) => ({ ...current, login: event.target.value }))
                }
              />
            </label>

            <label className="field">
              <span>Пароль</span>
              <input
                type="password"
                placeholder="Введите пароль"
                value={staffForm.password}
                onChange={(event) =>
                  setStaffForm((current) => ({ ...current, password: event.target.value }))
                }
              />
            </label>

            <button className="primary-button" type="submit">
              Войти в систему
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

export default App;
