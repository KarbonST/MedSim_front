import { startTransition, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

const playerRoles = [
  'Главный врач',
  'Главная медсестра',
  'Главный инженер',
  'Медсестра',
  'Заместитель инженера',
  'Другая должность',
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
    sessionCode: '',
  });
  const [staffForm, setStaffForm] = useState({
    profile: accessProfiles[0].id,
    login: '',
    password: '',
  });
  const [joinState, setJoinState] = useState({
    loading: false,
    error: '',
    session: null,
  });

  const activeProfile =
    accessProfiles.find((profile) => profile.id === staffForm.profile) ?? accessProfiles[0];

  const handlePlayerSubmit = async (event) => {
    event.preventDefault();
    setJoinState((current) => ({ ...current, loading: true, error: '' }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/player-sessions/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: playerForm.name,
          hospitalPosition: playerForm.hospitalRole,
          sessionCode: playerForm.sessionCode,
        }),
      });

      if (!response.ok) {
        const fallbackMessage = response.status === 400
          ? 'Проверьте имя, должность и код сессии.'
          : 'Не удалось подключиться к сессии. Попробуйте ещё раз.';

        throw new Error(fallbackMessage);
      }

      const payload = await response.json();
      startTransition(() => {
        setJoinState({
          loading: false,
          error: '',
          session: payload,
        });
      });
    } catch (error) {
      setJoinState({
        loading: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка.',
        session: null,
      });
    }
  };

  const handleStaffSubmit = (event) => {
    event.preventDefault();
    console.log('staff login', staffForm);
  };

  const resetPlayerFlow = () => {
    setJoinState({ loading: false, error: '', session: null });
    setPlayerForm((current) => ({ ...current, sessionCode: '' }));
  };

  return (
    <main className="page-shell">
      <section className="form-panel">
        {joinState.session ? (
          <section className="session-room">
            <div className="panel-header compact">
              <div className="brand-mark">MedSim</div>
              <div className="panel-copy">
                <p className="eyebrow">Стартовая комната сессии</p>
                <h1>Подключение выполнено</h1>
              </div>
            </div>

            <div className="room-hero">
              <div>
                <p className="section-kicker">Сессия</p>
                <h2>{joinState.session.sessionName}</h2>
              </div>
              <span className="status-pill">{joinState.session.sessionStatus}</span>
            </div>

            <div className="room-grid">
              <article className="info-card">
                <span>Код сессии</span>
                <strong>{joinState.session.sessionCode}</strong>
              </article>
              <article className="info-card">
                <span>Участник</span>
                <strong>{joinState.session.displayName}</strong>
              </article>
              <article className="info-card">
                <span>Должность</span>
                <strong>{joinState.session.hospitalPosition}</strong>
              </article>
              <article className="info-card">
                <span>Игровая роль</span>
                <strong>{joinState.session.gameRole ?? 'Назначается ведущим'}</strong>
              </article>
            </div>

            <div className="waiting-note">
              <p>
                Вы уже в стартовой комнате. Дождитесь начала игры и назначения роли
                ведущим.
              </p>
            </div>

            <button type="button" className="secondary-button" onClick={resetPlayerFlow}>
              Вернуться на старт
            </button>
          </section>
        ) : (
          <>
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

                <label className="field">
                  <span>Код сессии</span>
                  <input
                    type="text"
                    placeholder="Например, WARD-12"
                    value={playerForm.sessionCode}
                    onChange={(event) =>
                      setPlayerForm((current) => ({ ...current, sessionCode: event.target.value }))
                    }
                  />
                </label>

                {joinState.error ? <p className="form-error">{joinState.error}</p> : null}

                <button className="primary-button" type="submit" disabled={joinState.loading}>
                  {joinState.loading ? 'Подключение...' : 'Подключиться к сессии'}
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
          </>
        )}
      </section>
    </main>
  );
}

export default App;
