import { accessProfiles } from '../constants/accessProfiles';

function StaffLoginForm({ formState, onChange, onSubmit }) {
  const activeProfile =
    accessProfiles.find((profile) => profile.id === formState.profile) ?? accessProfiles[0];

  return (
    <form className="entry-form" onSubmit={onSubmit}>
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
            className={formState.profile === profile.id ? 'access-card active' : 'access-card'}
            onClick={() => onChange('profile', profile.id)}
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
          value={formState.login}
          onChange={(event) => onChange('login', event.target.value)}
        />
      </label>

      <label className="field">
        <span>Пароль</span>
        <input
          type="password"
          placeholder="Введите пароль"
          value={formState.password}
          onChange={(event) => onChange('password', event.target.value)}
        />
      </label>

      <button className="primary-button" type="submit">
        Войти в систему
      </button>
    </form>
  );
}

export default StaffLoginForm;
