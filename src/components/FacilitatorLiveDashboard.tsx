import { useEffect, useMemo, useState } from 'react';
import type { GameSessionParticipantsResponse, SessionParticipantSummary } from '../types/app';
import { getSessionStatusLabel } from '../constants/sessionStatuses';
import CollapsibleSection from './CollapsibleSection';
import TeamChatFeed from './TeamChatFeed';
import { useFacilitatorTeamChats } from '../hooks/useFacilitatorTeamChats';

interface FacilitatorLiveDashboardProps {
  session: GameSessionParticipantsResponse;
  loading: boolean;
  authHeader: string;
}

const leadershipRoles = new Set(['Главный врач', 'Главная медсестра', 'Главный инженер']);

function FacilitatorLiveDashboard({ session, loading, authHeader }: FacilitatorLiveDashboardProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(session.teams[0]?.teamId ?? null);

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
  const selectedTeamParticipants = selectedTeam ? (teamParticipantsMap[selectedTeam.teamId] ?? []) : [];

  return (
    <div className="session-setup-stack facilitator-live-stack">
      <CollapsibleSection
        kicker="Мониторинг игры"
        title="Команды после старта"
        className="facilitator-live-panel"
        defaultExpanded
        badge={(
          <span className="status-pill subtle-status-pill">
            {loading ? 'Обновление...' : `Активных команд: ${session.teams.length}`}
          </span>
        )}
      >
        <div className="waiting-note">
          <p>
            После старта команды работают изолированно. Здесь отображается сводка по всем командам и доступен быстрый переход к составу каждой команды без перехода в экран конкретного игрока.
          </p>
        </div>

        <div className="team-cards facilitator-dashboard-teams">
          {session.teams.map((team) => {
            const teamParticipants = teamParticipantsMap[team.teamId] ?? [];
            const assignedRolesCount = teamParticipants.filter((participant) => participant.gameRole).length;
            const leadershipCount = teamParticipants.filter((participant) => leadershipRoles.has(participant.gameRole ?? '')).length;
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
                  <span>Роли выданы: {assignedRolesCount}/{teamParticipants.length}</span>
                  <span>Руководящих ролей: {leadershipCount}/3</span>
                  <span>Без роли: {teamParticipants.filter((participant) => !participant.gameRole).length}</span>
                </div>
              </article>
            );
          })}
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        kicker="Чаты команд"
        title="Переписка обеих команд"
        className="facilitator-live-panel"
        defaultExpanded={false}
        badge={(
          <span className="status-pill subtle-status-pill">
            {chatState.loading ? 'Загрузка чатов...' : `Чатов команд: ${chatState.teamChats.length}`}
          </span>
        )}
      >
        <div className="waiting-note">
          <p>
            Здесь отображаются сообщения обеих команд в реальном времени. Игроки видят только свой чат, а обзор всех переписок доступен только ведущему.
          </p>
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

      {selectedTeam ? (
        <CollapsibleSection
          kicker="Детали команды"
          title={selectedTeam.teamName}
          className="facilitator-live-panel"
          defaultExpanded={false}
          badge={<span className="status-pill subtle-status-pill">Участников: {selectedTeamParticipants.length}</span>}
        >
          <div className="room-grid facilitator-monitoring-grid">
            <article className="info-card">
              <span>Код сессии</span>
              <strong>{session.sessionCode}</strong>
            </article>
            <article className="info-card">
              <span>Статус сессии</span>
              <strong>{getSessionStatusLabel(session.sessionStatus)}</strong>
            </article>
            <article className="info-card">
              <span>Этапов настроено</span>
              <strong>{session.stages.length}</strong>
            </article>
            <article className="info-card">
              <span>Команда</span>
              <strong>{selectedTeam.teamName}</strong>
            </article>
          </div>

          <div className="participants-list role-management-list workspace-members-list">
            {selectedTeamParticipants.map((participant, index) => (
              <article key={participant.participantId} className="participant-card team-member-card">
                <div className="participant-card-header">
                  <span className="participant-index">#{index + 1}</span>
                  <div>
                    <strong>{participant.displayName}</strong>
                    <p className="participant-role-subtitle">{participant.hospitalPosition}</p>
                  </div>
                </div>

                <dl className="participant-details participant-management-details">
                  <div>
                    <dt>Игровая роль</dt>
                    <dd>{participant.gameRole ?? 'Пока не назначена'}</dd>
                  </div>
                  <div>
                    <dt>Команда</dt>
                    <dd>{participant.teamName ?? 'Не указана'}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </CollapsibleSection>
      ) : null}
    </div>
  );
}

export default FacilitatorLiveDashboard;
