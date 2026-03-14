import type { PlayerTeamWorkspace } from '../types/app';
import BrandHeader from './BrandHeader';

interface PlayerTeamWorkspaceProps {
  workspace: PlayerTeamWorkspace;
  loading: boolean;
  refreshError: string;
  onReset: () => void;
}

function PlayerTeamWorkspaceScreen({
  workspace,
  loading,
  refreshError,
  onReset,
}: PlayerTeamWorkspaceProps) {
  const isFinished = workspace.sessionStatus === 'FINISHED';
  const hasTeam = workspace.teamId !== null;

  return (
    <section className="session-room">
      <BrandHeader
        compact
        eyebrow="Игровое пространство команды"
        title={hasTeam ? workspace.teamName ?? 'Командный экран' : 'Ожидание назначения команды'}
      />

      <div className="room-hero">
        <div>
          <p className="section-kicker">Сессия</p>
          <h2>{workspace.sessionName}</h2>
        </div>
        <span className="status-pill">{workspace.sessionStatus}</span>
      </div>

      <div className="room-grid">
        <article className="info-card">
          <span>Код сессии</span>
          <strong>{workspace.sessionCode}</strong>
        </article>
        <article className="info-card">
          <span>Участник</span>
          <strong>{workspace.displayName}</strong>
        </article>
        <article className="info-card">
          <span>Команда</span>
          <strong>{workspace.teamName ?? 'Команда пока не назначена'}</strong>
        </article>
        <article className="info-card">
          <span>Игровая роль</span>
          <strong>{workspace.gameRole ?? 'Роль назначается ведущим'}</strong>
        </article>
      </div>

      {!hasTeam ? (
        <div className="waiting-note">
          <p>
            Сессия уже запущена, но ведущий пока не назначил вам команду. Экран команды появится автоматически сразу
            после распределения.
          </p>
          {loading ? <p className="waiting-note-inline">Проверяем обновления...</p> : null}
          {refreshError ? <p className="form-error waiting-note-inline">{refreshError}</p> : null}
        </div>
      ) : (
        <>
          <div className="participants-panel">
            <div className="participants-panel-header">
              <div>
                <p className="section-kicker">Состав команды</p>
                <h3>Только ваша команда</h3>
              </div>
              <span className="status-pill subtle-status-pill">Участников: {workspace.teammates.length}</span>
            </div>

            <div className="participants-list workspace-members-list">
              {workspace.teammates.map((member, index) => (
                <article
                  key={member.participantId}
                  className={member.currentParticipant ? 'participant-card team-member-card current-team-member' : 'participant-card team-member-card'}
                >
                  <div className="participant-card-header">
                    <span className="participant-index">#{index + 1}</span>
                    <div>
                      <strong>{member.displayName}</strong>
                      <p className="participant-role-subtitle">
                        {member.currentParticipant ? 'Это вы' : 'Участник вашей команды'}
                      </p>
                    </div>
                  </div>

                  <dl className="participant-details">
                    <div>
                      <dt>Реальная должность</dt>
                      <dd>{member.hospitalPosition}</dd>
                    </div>
                    <div>
                      <dt>Игровая роль</dt>
                      <dd>{member.gameRole ?? 'Назначается ведущим'}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </div>

          <div className="participants-panel">
            <div className="participants-panel-header">
              <div>
                <p className="section-kicker">Этапы игры</p>
                <h3>Текущая конфигурация сессии</h3>
              </div>
            </div>

            <div className="stage-editors workspace-stage-list">
              {workspace.stages.map((stage) => (
                <article key={stage.stageNumber} className="stage-editor-card workspace-stage-card">
                  <div className="stage-editor-header">
                    <strong>Этап {stage.stageNumber}</strong>
                    <span className="stage-editor-hint">{stage.durationMinutes} мин.</span>
                  </div>
                  <p className="stage-editor-description">
                    {stage.interactionMode === 'CHAT_ONLY'
                      ? 'На этапе доступен только командный чат.'
                      : 'На этапе доступны чат и канбан-доска команды.'}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="waiting-note">
            <p>
              {isFinished
                ? 'Сессия завершена. Командный экран оставлен доступным для просмотра итогового состава команды.'
                : 'Вы видите только состояние своей команды. Данные других команд скрыты от участников.'}
            </p>
            {loading ? <p className="waiting-note-inline">Обновляем состояние команды...</p> : null}
            {refreshError ? <p className="form-error waiting-note-inline">{refreshError}</p> : null}
          </div>
        </>
      )}

      <button type="button" className="secondary-button" onClick={onReset}>
        Вернуться на старт
      </button>
    </section>
  );
}

export default PlayerTeamWorkspaceScreen;
