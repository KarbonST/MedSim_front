import BrandHeader from './BrandHeader';

function SessionWaitingRoom({ session, onReset }) {
  return (
    <section className="session-room">
      <BrandHeader
        compact
        eyebrow="Стартовая комната сессии"
        title="Подключение выполнено"
      />

      <div className="room-hero">
        <div>
          <p className="section-kicker">Сессия</p>
          <h2>{session.sessionName}</h2>
        </div>
        <span className="status-pill">{session.sessionStatus}</span>
      </div>

      <div className="room-grid">
        <article className="info-card">
          <span>Код сессии</span>
          <strong>{session.sessionCode}</strong>
        </article>
        <article className="info-card">
          <span>Участник</span>
          <strong>{session.displayName}</strong>
        </article>
        <article className="info-card">
          <span>Должность</span>
          <strong>{session.hospitalPosition}</strong>
        </article>
        <article className="info-card">
          <span>Игровая роль</span>
          <strong>{session.gameRole ?? 'Назначается ведущим'}</strong>
        </article>
      </div>

      <div className="waiting-note">
        <p>
          Вы уже в стартовой комнате. Дождитесь начала игры и назначения роли
          ведущим.
        </p>
      </div>

      <button type="button" className="secondary-button" onClick={onReset}>
        Вернуться на старт
      </button>
    </section>
  );
}

export default SessionWaitingRoom;
