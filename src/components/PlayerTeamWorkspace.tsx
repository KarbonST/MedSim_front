import { useEffect, useState } from 'react';
import type { PlayerTeamWorkspace } from '../types/app';
import BrandHeader from './BrandHeader';
import { getSessionStatusLabel } from '../constants/sessionStatuses';
import { formatRuntimeDuration, getInteractionModeLabel, getRuntimeRemainingSeconds, getTimerStatusLabel } from '../lib/sessionRuntime';

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
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (workspace.sessionRuntime.timerStatus !== 'RUNNING') {
      return;
    }

    setNowMs(Date.now());
    const timerId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [workspace.sessionRuntime.timerStatus, workspace.sessionRuntime.timerEndsAt]);

  const remainingSeconds = getRuntimeRemainingSeconds(workspace.sessionRuntime, nowMs);
  const currentStageLabel = workspace.sessionRuntime.activeStageNumber == null
    ? 'Пока не выбран'
    : `Этап ${workspace.sessionRuntime.activeStageNumber}`;

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
        <span className="status-pill">{getSessionStatusLabel(workspace.sessionStatus)}</span>
      </div>

      <div className="participants-panel player-runtime-panel">
        <div className="participants-panel-header">
          <div>
            <p className="section-kicker">Ход игры</p>
            <h3>Текущий этап и время</h3>
          </div>
          <span className="status-pill subtle-status-pill runtime-status-pill">
            {getTimerStatusLabel(workspace.sessionRuntime.timerStatus)}
          </span>
        </div>

        <div className="player-runtime-grid">
          <article className="info-card player-runtime-card">
            <span>Текущий этап</span>
            <strong>{currentStageLabel}</strong>
          </article>
          <article className="info-card player-runtime-card player-runtime-card--timer">
            <span>До конца этапа</span>
            <strong className="player-runtime-timer">{formatRuntimeDuration(remainingSeconds)}</strong>
          </article>
          <article className="info-card player-runtime-card">
            <span>Доступно на этапе</span>
            <strong>{getInteractionModeLabel(workspace.sessionRuntime.activeStageInteractionMode)}</strong>
          </article>
        </div>
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
                : 'На экране отображаются только данные вашей команды, текущий этап и общий таймер игры. Информация по другим командам скрыта.'}
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
