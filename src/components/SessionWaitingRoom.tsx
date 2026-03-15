import type { PlayerSession, PlayerTeamWorkspace } from '../types/app';
import BrandHeader from './BrandHeader';
import { getSessionStatusLabel } from '../constants/sessionStatuses';

interface SessionWaitingRoomProps {
  session: PlayerSession;
  workspace: PlayerTeamWorkspace | null;
  workspaceLoading: boolean;
  workspaceError: string;
  onReset: () => void;
}

function SessionWaitingRoom({
  session,
  workspace,
  workspaceLoading,
  workspaceError,
  onReset,
}: SessionWaitingRoomProps) {
  const teamName = workspace?.teamName ?? 'Команда назначается ведущим';
  const stagesCount = workspace?.stages.length ?? 0;

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
        <span className="status-pill">{getSessionStatusLabel(workspace?.sessionStatus ?? session.sessionStatus)}</span>
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
          <span>Реальная должность</span>
          <strong>{session.hospitalPosition}</strong>
        </article>
        <article className="info-card">
          <span>Игровая роль</span>
          <strong>{workspace?.gameRole ?? session.gameRole ?? 'Назначается ведущим'}</strong>
        </article>
        <article className="info-card">
          <span>Команда</span>
          <strong>{teamName}</strong>
        </article>
        <article className="info-card">
          <span>Этапы игры</span>
          <strong>{stagesCount ? `${stagesCount} этапа` : 'Настраиваются ведущим'}</strong>
        </article>
      </div>

      <div className="waiting-note">
        <p>
          Вы уже в стартовой комнате. После запуска сессии экран автоматически переключится на рабочее пространство
          вашей команды.
        </p>
        {workspaceLoading ? <p className="waiting-note-inline">Обновляем состояние игровой комнаты...</p> : null}
        {workspaceError ? <p className="form-error waiting-note-inline">{workspaceError}</p> : null}
      </div>

      <button type="button" className="secondary-button" onClick={onReset}>
        Вернуться на старт
      </button>
    </section>
  );
}

export default SessionWaitingRoom;
