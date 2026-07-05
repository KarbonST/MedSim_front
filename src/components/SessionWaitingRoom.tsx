import { useMemo, useState } from 'react';
import type { PlayerSession, PlayerTeamWorkspace } from '../types/app';
import BrandHeader from './BrandHeader';
import { getSessionStatusLabel } from '../constants/sessionStatuses';
import MenuToggleButton from './MenuToggleButton';
import WorkspaceDrawer from './WorkspaceDrawer';

type WaitingRoomView = 'session' | 'participant' | 'status';

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
  const currentSessionStatus = workspace?.sessionStatus ?? session.sessionStatus;
  const isPaused = currentSessionStatus === 'PAUSED';
  const isFinished = currentSessionStatus === 'FINISHED';
  const teamName = workspace?.teamName ?? 'Команда назначается ведущим';
  const stagesCount = workspace?.stages.length ?? 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState<WaitingRoomView>('session');
  const waitingRoomNav = useMemo(() => ([
    {
      id: 'session' as const,
      label: 'Сессия',
      description: 'Название, код и этапы игры',
    },
    {
      id: 'participant' as const,
      label: 'Участник',
      description: 'Роль, должность и команда',
    },
    {
      id: 'status' as const,
      label: 'Статус',
      description: 'Подключение и ожидание запуска',
    },
  ]), []);
  const activeNavItem = waitingRoomNav.find((item) => item.id === activeView);

  const renderActivePanel = () => {
    switch (activeView) {
      case 'session':
        return (
          <div className="room-grid">
            <article className="info-card">
              <span>Название сессии</span>
              <strong>{session.sessionName}</strong>
            </article>
            <article className="info-card">
              <span>Код сессии</span>
              <strong>{session.sessionCode}</strong>
            </article>
            <article className="info-card">
              <span>Этапы игры</span>
              <strong>{stagesCount ? `${stagesCount} этапа` : 'Настраиваются ведущим'}</strong>
            </article>
            <article className="info-card">
              <span>Статус</span>
              <strong>{getSessionStatusLabel(currentSessionStatus)}</strong>
            </article>
          </div>
        );
      case 'participant':
        return (
          <div className="room-grid">
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
          </div>
        );
      case 'status':
        return (
          <div className="waiting-note">
            <p>
              {isFinished
                ? 'Игра завершена. Игровые разделы и действия заблокированы. Участник остаётся только на информационном экране до выхода из сессии.'
                : isPaused
                ? 'Игра поставлена на паузу. Игровые разделы и действия временно заблокированы до возобновления сессии ведущим.'
                : 'Вы уже в стартовой комнате. После запуска сессии экран автоматически переключится на рабочее пространство вашей команды.'}
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section className="session-room">
      <BrandHeader
        compact
        eyebrow={isFinished
          ? 'Сессия завершена'
          : isPaused
            ? 'Сессия временно приостановлена'
            : 'Стартовая комната сессии'}
        title={isFinished
          ? 'Игра завершена'
          : isPaused
            ? 'Игра на паузе'
            : 'Подключение выполнено'}
        actions={(
          <MenuToggleButton
            expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
          />
        )}
      />

      <div className="room-hero">
        <div>
          <p className="section-kicker">Сессия</p>
          <h2>{session.sessionName}</h2>
        </div>
        <span className="status-pill">{getSessionStatusLabel(currentSessionStatus)}</span>
      </div>

      <div className="workspace-page-indicator">
        <div>
          <span className="section-kicker">Открыт раздел</span>
          <strong>{activeNavItem?.label ?? 'Стартовая комната'}</strong>
        </div>
        {workspaceLoading ? <span className="status-pill subtle-status-pill">Обновление...</span> : null}
      </div>

      {workspaceError ? <p className="form-error workspace-inline-error">{workspaceError}</p> : null}

      {renderActivePanel()}

      <WorkspaceDrawer
        open={menuOpen}
        title="Меню участника"
        subtitle={`${session.displayName} · ${session.sessionCode}`}
        sections={[
          {
            title: 'Стартовая комната',
            items: waitingRoomNav.map((item) => ({
              ...item,
              active: activeView === item.id,
            })),
          },
        ]}
        footer={(
          <button type="button" className="secondary-button" onClick={onReset}>
            Вернуться на старт
          </button>
        )}
        onSelect={(viewId) => setActiveView(viewId as WaitingRoomView)}
        onClose={() => setMenuOpen(false)}
      />
    </section>
  );
}

export default SessionWaitingRoom;
