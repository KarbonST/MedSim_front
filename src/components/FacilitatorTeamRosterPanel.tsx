import { useEffect, useMemo, useState } from 'react';
import type {
  GameSessionParticipantsResponse,
  SessionParticipantSummary,
} from '../types/app';
import CollapsibleSection from './CollapsibleSection';

const leadershipRoles = new Set(['Главный врач', 'Главная медсестра', 'Главный инженер']);

interface FacilitatorTeamRosterPanelProps {
  session: GameSessionParticipantsResponse;
}

function FacilitatorTeamRosterPanel({
  session,
}: FacilitatorTeamRosterPanelProps) {
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

  const selectedTeam = session.teams.find((team) => team.teamId === selectedTeamId) ?? session.teams[0] ?? null;
  const selectedTeamParticipants = selectedTeam ? (teamParticipantsMap[selectedTeam.teamId] ?? []) : [];

  return (
    <div className="session-setup-stack facilitator-live-stack">
      <CollapsibleSection
        kicker="Состав команд"
        title="Участники и игровые роли"
        className="facilitator-live-panel"
        defaultExpanded
        badge={<span className="status-pill subtle-status-pill">Команд: {session.teams.length}</span>}
      >
        <div className="waiting-note compact-note">
          <p>Выберите команду, чтобы посмотреть состав, роли и реальные должности участников.</p>
        </div>

        <div className="team-cards facilitator-dashboard-teams">
          {session.teams.map((team) => {
            const teamParticipants = teamParticipantsMap[team.teamId] ?? [];
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
                  <span>Роли: {teamParticipants.filter((participant) => participant.gameRole).length}/{teamParticipants.length}</span>
                  <span>Лидеры: {teamParticipants.filter((participant) => leadershipRoles.has(participant.gameRole ?? '')).length}/3</span>
                  <span>Без роли: {teamParticipants.filter((participant) => !participant.gameRole).length}</span>
                </div>
              </article>
            );
          })}
        </div>

        {selectedTeam ? (
          <>
            <div className="room-grid facilitator-monitoring-grid">
              <article className="info-card">
                <span>Команда</span>
                <strong>{selectedTeam.teamName}</strong>
              </article>
              <article className="info-card">
                <span>Участники</span>
                <strong>{selectedTeamParticipants.length}</strong>
              </article>
              <article className="info-card">
                <span>Руководящие роли</span>
                <strong>{selectedTeamParticipants.filter((participant) => leadershipRoles.has(participant.gameRole ?? '')).length}/3</strong>
              </article>
              <article className="info-card">
                <span>Без роли</span>
                <strong>{selectedTeamParticipants.filter((participant) => !participant.gameRole).length}</strong>
              </article>
            </div>

            {selectedTeamParticipants.length ? (
              <div className="participants-list role-management-list workspace-members-list">
                {selectedTeamParticipants.map((participant, index) => (
                  <article key={participant.participantId} className="participant-card team-member-card">
                    <div className="participant-card-header">
                      <span className="participant-index">#{index + 1}</span>
                      <div>
                        <strong>{participant.displayName}</strong>
                        <p className="participant-role-subtitle">{participant.gameRole ?? 'Игровая роль не назначена'}</p>
                      </div>
                    </div>

                    <dl className="participant-details participant-management-details">
                      <div>
                        <dt>Реальная должность</dt>
                        <dd>{participant.hospitalPosition}</dd>
                      </div>
                      <div>
                        <dt>Команда</dt>
                        <dd>{participant.teamName ?? 'Не указана'}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            ) : (
              <div className="waiting-note compact-note">
                <p>У выбранной команды пока нет участников.</p>
              </div>
            )}
          </>
        ) : (
          <div className="waiting-note compact-note">
            <p>Команды ещё не подготовлены.</p>
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}

export default FacilitatorTeamRosterPanel;
