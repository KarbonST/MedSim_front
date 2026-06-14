import { useEffect, useMemo, useState } from 'react';
import type {
  GameSessionEconomyResponse,
  GameSessionKanbanResponse,
  GameSessionParticipantsResponse,
  SessionParticipantSummary,
  TeamProblemEconomyItem,
  TeamProblemStatus,
  TeamRoomEconomyItem,
} from '../types/app';
import { getSessionStatusLabel } from '../constants/sessionStatuses';
import {
  formatRuntimeDuration,
  getInteractionModeLabel,
  getRuntimeRemainingSeconds,
  getTimerStatusLabel,
} from '../lib/sessionRuntime';
import CollapsibleSection from './CollapsibleSection';
import TeamChatFeed from './TeamChatFeed';
import { useFacilitatorTeamChats } from '../hooks/useFacilitatorTeamChats';
import ChiefDoctorHospitalPlan from './ChiefDoctorHospitalPlan';
import TeamKanbanBoard from './TeamKanbanBoard';

interface FacilitatorLiveDashboardProps {
  session: GameSessionParticipantsResponse;
  loading: boolean;
  authHeader: string;
  economyOverview: GameSessionEconomyResponse | null;
  kanbanOverview: GameSessionKanbanResponse | null;
}

interface DashboardProblemItem extends TeamProblemEconomyItem {
  roomName: string;
  roomCode: string;
  roomStateId: number;
}

const leadershipRoles = new Set(['Главный врач', 'Главная медсестра', 'Главный инженер']);

const problemStatusLabels: Record<TeamProblemStatus, string> = {
  ACTIVE: 'Активна',
  IN_PROGRESS: 'В работе',
  RESOLVED: 'Решена',
  IGNORED: 'Игнорируется',
};

const problemSeverityLabels: Record<TeamProblemEconomyItem['severity'], string> = {
  MINOR: 'Незначительная',
  SERIOUS: 'Серьёзная',
  CRITICAL: 'Критическая',
};

const severityOrder: Record<TeamProblemEconomyItem['severity'], number> = {
  CRITICAL: 0,
  SERIOUS: 1,
  MINOR: 2,
};

function buildDashboardProblems(rooms: TeamRoomEconomyItem[]): DashboardProblemItem[] {
  return rooms
    .flatMap((room) => room.problems.map((problem) => ({
      ...problem,
      roomName: room.roomName,
      roomCode: room.roomCode,
      roomStateId: room.roomStateId,
    })))
    .sort((left, right) => {
      const severityDiff = severityOrder[left.severity] - severityOrder[right.severity];
      if (severityDiff !== 0) {
        return severityDiff;
      }

      const stageDiff = left.stageNumber - right.stageNumber;
      if (stageDiff !== 0) {
        return stageDiff;
      }

      const roomDiff = left.roomName.localeCompare(right.roomName, 'ru');
      if (roomDiff !== 0) {
        return roomDiff;
      }

      return left.problemNumber - right.problemNumber;
    });
}

function FacilitatorLiveDashboard({
  session,
  loading,
  authHeader,
  economyOverview,
  kanbanOverview,
}: FacilitatorLiveDashboardProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(session.teams[0]?.teamId ?? null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [runtimeSyncedAtMs, setRuntimeSyncedAtMs] = useState<number | null>(() => Date.now());

  useEffect(() => {
    if (!session.teams.length) {
      setSelectedTeamId(null);
      return;
    }

    const teamStillExists = session.teams.some((team) => team.teamId === selectedTeamId);

    if (!teamStillExists) {
      setSelectedTeamId(session.teams[0]?.teamId ?? null);
    }
  }, [selectedTeamId, session.teams]);

  useEffect(() => {
    setRuntimeSyncedAtMs(Date.now());
  }, [
    session.sessionRuntime.activeStageNumber,
    session.sessionRuntime.timerStatus,
    session.sessionRuntime.remainingSeconds,
  ]);

  useEffect(() => {
    if (session.sessionRuntime.timerStatus !== 'RUNNING') {
      return;
    }

    setNowMs(Date.now());
    const timerId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [session.sessionRuntime.timerStatus, session.sessionRuntime.timerEndsAt]);

  const teamParticipantsMap = useMemo(() => {
    return session.teams.reduce<Record<number, SessionParticipantSummary[]>>((accumulator, team) => {
      accumulator[team.teamId] = session.participants.filter((participant) => participant.teamId === team.teamId);
      return accumulator;
    }, {});
  }, [session.participants, session.teams]);

  const { chatState } = useFacilitatorTeamChats({
    sessionCode: session.sessionCode,
    authHeader,
    enabled: true,
  });

  const selectedTeam = session.teams.find((team) => team.teamId === selectedTeamId) ?? session.teams[0] ?? null;
  const selectedTeamEconomy = selectedTeam
    ? economyOverview?.teams.find((team) => team.teamId === selectedTeam.teamId) ?? null
    : null;
  const selectedTeamKanbanBoard = selectedTeam
    ? kanbanOverview?.teams.find((team) => team.teamId === selectedTeam.teamId)?.teamKanbanBoard ?? null
    : null;
  const selectedTeamProblems = useMemo(
    () => buildDashboardProblems(selectedTeamEconomy?.rooms ?? []),
    [selectedTeamEconomy],
  );

  const activeStageNumber = session.sessionRuntime.activeStageNumber;
  const activeInteractionMode = session.sessionRuntime.activeStageInteractionMode;
  const remainingSeconds = getRuntimeRemainingSeconds(
    session.sessionRuntime,
    nowMs,
    runtimeSyncedAtMs,
  );
  const kanbanVisibleOnStage = activeInteractionMode === 'CHAT_AND_KANBAN';

  return (
    <div className="session-setup-stack facilitator-live-stack">
      <CollapsibleSection
        kicker="Командный экран"
        title="Дашборд команд"
        className="facilitator-live-panel"
        defaultExpanded
        badge={(
          <span className="status-pill subtle-status-pill">
            {loading ? 'Обновление...' : `Команд: ${session.teams.length}`}
          </span>
        )}
      >
        <div className="waiting-note compact-note">
          <p>Выберите команду и откройте этот экран на отдельном мониторе или телевизоре для живого обзора.</p>
        </div>

        <div className="team-cards facilitator-dashboard-teams">
          {session.teams.map((team) => {
            const teamParticipants = teamParticipantsMap[team.teamId] ?? [];
            const assignedRolesCount = teamParticipants.filter((participant) => participant.gameRole).length;
            const isSelected = selectedTeam?.teamId === team.teamId;

            return (
              <article
                key={team.teamId}
                className={isSelected ? 'team-card facilitator-dashboard-card selected-dashboard-card' : 'team-card facilitator-dashboard-card'}
                onClick={() => setSelectedTeamId(team.teamId)}
              >
                <div className="team-card-header">
                  <div>
                    <span className="team-order-badge">Команда {team.sortOrder}</span>
                    <strong>{team.teamName}</strong>
                  </div>
                  <span className="status-pill subtle-status-pill">Игроков: {teamParticipants.length}</span>
                </div>

                <div className="session-card-metrics facilitator-team-metrics">
                  <span>Роли: {assignedRolesCount}/{teamParticipants.length}</span>
                  <span>Лидеры: {teamParticipants.filter((participant) => leadershipRoles.has(participant.gameRole ?? '')).length}/3</span>
                  <span>Без роли: {teamParticipants.filter((participant) => !participant.gameRole).length}</span>
                </div>
              </article>
            );
          })}
        </div>

        {selectedTeam ? (
          <div className="facilitator-team-dashboard">
            <section className="facilitator-team-dashboard-panel facilitator-team-dashboard-panel--hero">
              <div className="facilitator-dashboard-runtime-strip">
                <article className="session-control-timer-card facilitator-dashboard-timer-card">
                  <span>До конца этапа</span>
                  <strong className="stage-timer-display">{formatRuntimeDuration(remainingSeconds)}</strong>
                  <span className="status-pill subtle-status-pill runtime-status-pill">
                    {getTimerStatusLabel(session.sessionRuntime.timerStatus)}
                  </span>
                </article>

                <div className="facilitator-dashboard-team-heading">
                  <p className="section-kicker">Активная команда</p>
                  <h3>{selectedTeam.teamName}</h3>
                  <p className="participant-role-subtitle">
                    {activeStageNumber
                      ? `Этап ${activeStageNumber} · ${getInteractionModeLabel(activeInteractionMode)}`
                      : 'Этап пока не выбран'}
                  </p>
                  <div className="facilitator-dashboard-summary-badges">
                    <span className="status-pill subtle-status-pill">
                      {getSessionStatusLabel(session.sessionStatus)}
                    </span>
                    <span className="status-pill subtle-status-pill">
                      {kanbanVisibleOnStage ? 'Канбан активен' : 'Раунд без канбана'}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="facilitator-team-dashboard-panel">
              <div className="facilitator-team-dashboard-panel-header">
                <div>
                  <p className="section-kicker">Карта больницы</p>
                  <h4>Кабинеты и количество проблем</h4>
                </div>
                <span className="status-pill subtle-status-pill">
                  {selectedTeamEconomy ? `Команда ${selectedTeam.sortOrder}` : 'Загрузка...'}
                </span>
              </div>

              <ChiefDoctorHospitalPlan
                rooms={selectedTeamEconomy?.rooms ?? []}
                orientation="horizontal"
                detailMode="none"
                emptyText="Данные карты команды пока не подготовлены."
              />
            </section>

            {kanbanVisibleOnStage ? (
              <section className="facilitator-team-dashboard-panel">
                <div className="facilitator-team-dashboard-panel-header">
                  <div>
                    <p className="section-kicker">Канбан команды</p>
                    <h4>Полная доска в режиме просмотра</h4>
                  </div>
                  <span className="status-pill subtle-status-pill">
                    {selectedTeamKanbanBoard ? `Карточек: ${selectedTeamKanbanBoard.cards.length}` : 'Загрузка...'}
                  </span>
                </div>

                <div className="waiting-note compact-note">
                  <p>Эту часть удобно выводить на отдельный экран: все перемещения карточек обновляются автоматически.</p>
                </div>

                <TeamKanbanBoard board={selectedTeamKanbanBoard} readOnly />
              </section>
            ) : (
              <section className="facilitator-team-dashboard-panel">
                <div className="facilitator-team-dashboard-panel-header">
                  <div>
                    <p className="section-kicker">Проблемы команды</p>
                    <h4>Список активных проблем текущего раунда</h4>
                  </div>
                  <span className="status-pill subtle-status-pill">
                    {selectedTeamProblems.length}
                  </span>
                </div>

                <div className="waiting-note compact-note">
                  <p>На текущем этапе команда работает без канбан-доски, поэтому здесь показан полный список актуальных проблем.</p>
                </div>

                {selectedTeamProblems.length ? (
                  <div className="facilitator-stage-problem-list">
                    {selectedTeamProblems.map((problem) => (
                      <article
                        key={problem.problemStateId}
                        className={`facilitator-stage-problem-card facilitator-stage-problem-card--${problem.severity.toLowerCase()}`}
                      >
                        <div className="facilitator-stage-problem-card-header">
                          <div>
                            <span className="section-kicker">{problem.roomName}</span>
                            <strong>{problem.problemNumber}. {problem.title}</strong>
                          </div>
                          <span className="status-pill subtle-status-pill">{problemSeverityLabels[problem.severity]}</span>
                        </div>

                        <p>
                          Этап {problem.stageNumber} · статус {problemStatusLabels[problem.status].toLowerCase()} ·
                          {' '}штраф {Number(problem.ignorePenalty).toFixed(2)}
                        </p>

                        <div className="facilitator-stage-problem-card-meta">
                          <span>Бюджет: {Number(problem.budgetCost).toFixed(2)}</span>
                          <span>Время: {problem.timeCost}</span>
                          {problem.requiredItemName && problem.requiredItemQuantity > 0 ? (
                            <span>Нужно: {problem.requiredItemName}, {problem.requiredItemQuantity} шт.</span>
                          ) : null}
                          {problem.escalated && problem.escalationTitle ? (
                            <span>{problem.escalationTitle}</span>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="waiting-note compact-note">
                    <p>У выбранной команды сейчас нет активных проблем для отображения.</p>
                  </div>
                )}
              </section>
            )}
          </div>
        ) : null}
      </CollapsibleSection>

      <CollapsibleSection
        kicker="Чаты команд"
        title="Переписка команд"
        className="facilitator-live-panel"
        defaultExpanded={false}
        badge={(
          <span className="status-pill subtle-status-pill">
            {chatState.loading ? 'Загрузка чатов...' : `Чатов: ${chatState.teamChats.length}`}
          </span>
        )}
      >
        <div className="waiting-note compact-note">
          <p>Дополнительный экран для контроля переписки. Можно держать свернутым, если нужен только дашборд.</p>
        </div>

        <div className="facilitator-team-chat-grid">
          {chatState.teamChats.map((teamChat) => (
            <TeamChatFeed
              key={teamChat.teamId}
              title={teamChat.teamName}
              subtitle={`Команда ${teamChat.sortOrder}`}
              messages={teamChat.messages}
              loading={chatState.loading}
              connectionStatus={chatState.connectionStatus}
              emptyText="В этой команде пока нет сообщений."
            />
          ))}
        </div>

        {chatState.error ? <p className="form-error">{chatState.error}</p> : null}
      </CollapsibleSection>
    </div>
  );
}

export default FacilitatorLiveDashboard;
