import { useEffect, useMemo, useState } from 'react';
import { commonGameRoles, customGameRoleOption } from '../constants/gameRoles';
import type {
  GameSessionParticipantsResponse,
  SessionParticipantSummary,
} from '../types/app';
import CollapsibleSection from './CollapsibleSection';

const leadershipRoles = new Set(['Главный врач', 'Главная медсестра', 'Главный инженер']);

interface ManualRoleDraft {
  selectedRole: string;
  customRole: string;
}

interface RosterGroup {
  id: string;
  title: string;
  participants: SessionParticipantSummary[];
  badgeLabel: string;
}

interface FacilitatorTeamRosterPanelProps {
  session: GameSessionParticipantsResponse;
  teamAssignmentParticipantId: number | null;
  roleAssignmentParticipantId: number | null;
  onAssignParticipantTeam: (
    sessionCode: string,
    participantId: number,
    teamId: number | null,
  ) => void | Promise<void>;
  onAssignManualRole: (
    sessionCode: string,
    participantId: number,
    gameRole: string,
  ) => void | Promise<void>;
}

function buildManualRoleDrafts(
  participants: SessionParticipantSummary[],
): Record<number, ManualRoleDraft> {
  const nextDrafts: Record<number, ManualRoleDraft> = {};

  participants.forEach((participant) => {
    const role = participant.gameRole?.trim() ?? '';
    const isCommonRole = commonGameRoles.includes(role);

    nextDrafts[participant.participantId] = {
      selectedRole: role ? (isCommonRole ? role : customGameRoleOption) : '',
      customRole: role && !isCommonRole ? role : '',
    };
  });

  return nextDrafts;
}

function buildParticipantTeamDrafts(
  participants: SessionParticipantSummary[],
): Record<number, string> {
  return participants.reduce<Record<number, string>>((drafts, participant) => {
    drafts[participant.participantId] = participant.teamId ? String(participant.teamId) : '';
    return drafts;
  }, {});
}

function getDefaultGroupId(session: GameSessionParticipantsResponse): string | null {
  const hasUnassignedParticipants = session.participants.some((participant) => participant.teamId === null);

  if (hasUnassignedParticipants) {
    return 'unassigned';
  }

  return session.teams[0] ? `team-${session.teams[0].teamId}` : null;
}

function FacilitatorTeamRosterPanel({
  session,
  teamAssignmentParticipantId,
  roleAssignmentParticipantId,
  onAssignParticipantTeam,
  onAssignManualRole,
}: FacilitatorTeamRosterPanelProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(() => getDefaultGroupId(session));
  const [manualRoleDrafts, setManualRoleDrafts] = useState<Record<number, ManualRoleDraft>>(() => (
    buildManualRoleDrafts(session.participants)
  ));
  const [participantTeamDrafts, setParticipantTeamDrafts] = useState<Record<number, string>>(() => (
    buildParticipantTeamDrafts(session.participants)
  ));

  useEffect(() => {
    setManualRoleDrafts(buildManualRoleDrafts(session.participants));
    setParticipantTeamDrafts(buildParticipantTeamDrafts(session.participants));
  }, [session.participants]);

  const rosterGroups = useMemo<RosterGroup[]>(() => {
    const groups: RosterGroup[] = [];
    const unassignedParticipants = session.participants.filter((participant) => participant.teamId === null);

    if (unassignedParticipants.length > 0) {
      groups.push({
        id: 'unassigned',
        title: 'Нераспределённые',
        participants: unassignedParticipants,
        badgeLabel: `Игроков: ${unassignedParticipants.length}`,
      });
    }

    session.teams.forEach((team) => {
      const participants = session.participants.filter((participant) => participant.teamId === team.teamId);

      groups.push({
        id: `team-${team.teamId}`,
        title: team.teamName,
        participants,
        badgeLabel: `Игроков: ${participants.length}`,
      });
    });

    return groups;
  }, [session.participants, session.teams]);

  useEffect(() => {
    if (!rosterGroups.length) {
      setSelectedGroupId(null);
      return;
    }

    const selectedGroupStillExists = rosterGroups.some((group) => group.id === selectedGroupId);

    if (!selectedGroupStillExists) {
      setSelectedGroupId(rosterGroups[0]?.id ?? null);
    }
  }, [rosterGroups, selectedGroupId]);

  const selectedGroup = rosterGroups.find((group) => group.id === selectedGroupId) ?? rosterGroups[0] ?? null;
  const selectedParticipants = selectedGroup?.participants ?? [];
  const unassignedParticipantsCount = session.participants.filter((participant) => participant.teamId === null).length;

  const updateManualRoleDraft = (
    participantId: number,
    field: keyof ManualRoleDraft,
    value: string,
  ): void => {
    setManualRoleDrafts((current) => ({
      ...current,
      [participantId]: {
        selectedRole: current[participantId]?.selectedRole ?? '',
        customRole: current[participantId]?.customRole ?? '',
        [field]: value,
      },
    }));
  };

  const resolveGameRole = (participantId: number): string => {
    const draft = manualRoleDrafts[participantId];

    if (!draft) {
      return '';
    }

    if (draft.selectedRole === customGameRoleOption) {
      return draft.customRole.trim();
    }

    return draft.selectedRole.trim();
  };

  const handleAssignTeam = async (participantId: number): Promise<void> => {
    const teamDraft = participantTeamDrafts[participantId] ?? '';
    const selectedTeamId = teamDraft === '' ? null : Number.parseInt(teamDraft, 10);

    if (selectedTeamId !== null && Number.isNaN(selectedTeamId)) {
      return;
    }

    await onAssignParticipantTeam(session.sessionCode, participantId, selectedTeamId);
  };

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
          <p>Новые игроки, подключившиеся после старта, попадают в блок нераспределённых. Назначьте им команду, затем игровую роль.</p>
        </div>

        <div className="team-cards facilitator-dashboard-teams">
          {rosterGroups.map((group) => {
            const isSelected = selectedGroup?.id === group.id;
            const assignedRolesCount = group.participants.filter((participant) => participant.gameRole).length;
            const leadershipRolesCount = group.participants.filter((participant) => leadershipRoles.has(participant.gameRole ?? '')).length;

            return (
              <article
                key={group.id}
                className={isSelected ? 'team-card facilitator-dashboard-card selected-dashboard-card' : 'team-card facilitator-dashboard-card'}
                onClick={() => setSelectedGroupId(group.id)}
              >
                <div className="team-card-header">
                  <div>
                    <span className="team-order-badge">{group.id === 'unassigned' ? 'Ожидают назначения' : 'Игровая команда'}</span>
                    <strong>{group.title}</strong>
                  </div>
                  <span className="status-pill subtle-status-pill">{group.badgeLabel}</span>
                </div>

                <div className="session-card-metrics facilitator-team-metrics">
                  <span>Роли: {assignedRolesCount}/{group.participants.length}</span>
                  <span>Лидеры: {leadershipRolesCount}{group.id === 'unassigned' ? '' : '/3'}</span>
                  <span>Без роли: {group.participants.filter((participant) => !participant.gameRole).length}</span>
                </div>
              </article>
            );
          })}
        </div>

        {selectedGroup ? (
          <>
            <div className="room-grid facilitator-monitoring-grid">
              <article className="info-card">
                <span>Раздел</span>
                <strong>{selectedGroup.title}</strong>
              </article>
              <article className="info-card">
                <span>Участники</span>
                <strong>{selectedParticipants.length}</strong>
              </article>
              <article className="info-card">
                <span>Без команды</span>
                <strong>{unassignedParticipantsCount}</strong>
              </article>
              <article className="info-card">
                <span>Без роли</span>
                <strong>{selectedParticipants.filter((participant) => !participant.gameRole).length}</strong>
              </article>
            </div>

            {selectedParticipants.length ? (
              <div className="participants-list role-management-list workspace-members-list">
                {selectedParticipants.map((participant, index) => {
                  const roleDraft = manualRoleDrafts[participant.participantId] ?? {
                    selectedRole: '',
                    customRole: '',
                  };
                  const resolvedRole = resolveGameRole(participant.participantId);
                  const isParticipantUpdating = roleAssignmentParticipantId === participant.participantId;
                  const isTeamUpdating = teamAssignmentParticipantId === participant.participantId;
                  const teamDraft = participantTeamDrafts[participant.participantId] ?? '';
                  const currentTeamDraft = participant.teamId === null ? '' : String(participant.teamId);
                  const isTeamDraftChanged = teamDraft !== currentTeamDraft;
                  const hasTeam = participant.teamId !== null;
                  const teamActionLabel = currentTeamDraft === ''
                    ? 'Назначить в команду'
                    : teamDraft === ''
                      ? 'Вернуть в нераспределённые'
                      : 'Переместить в команду';

                  return (
                    <article key={participant.participantId} className="participant-card team-member-card participant-role-card--expanded">
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
                          <dd>{participant.teamName ?? 'Нераспределённый участник'}</dd>
                        </div>
                      </dl>

                      <div className="participant-role-form participant-team-form">
                        <label className="field compact-field">
                          <span>Команда участника</span>
                          <select
                            value={teamDraft}
                            onChange={(event) => {
                              setParticipantTeamDrafts((current) => ({
                                ...current,
                                [participant.participantId]: event.target.value,
                              }));
                            }}
                            disabled={isTeamUpdating || isParticipantUpdating}
                          >
                            <option value="">Нераспределённые</option>
                            {session.teams.map((team) => (
                              <option key={team.teamId} value={team.teamId}>
                                {team.teamName}
                              </option>
                            ))}
                          </select>
                        </label>

                        <button
                          type="button"
                          className="secondary-button compact-button"
                          onClick={() => {
                            void handleAssignTeam(participant.participantId);
                          }}
                          disabled={isTeamUpdating || isParticipantUpdating || !isTeamDraftChanged}
                        >
                          {isTeamUpdating ? 'Сохранение...' : teamActionLabel}
                        </button>
                      </div>

                      <div className="participant-role-form">
                        <label className="field compact-field">
                          <span>Игровая роль</span>
                          <select
                            value={roleDraft.selectedRole}
                            onChange={(event) => {
                              updateManualRoleDraft(
                                participant.participantId,
                                'selectedRole',
                                event.target.value,
                              );
                            }}
                            disabled={!hasTeam || isParticipantUpdating || isTeamUpdating}
                          >
                            <option value="">Выберите роль</option>
                            {commonGameRoles.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                            <option value={customGameRoleOption}>Своя роль</option>
                          </select>
                        </label>

                        {roleDraft.selectedRole === customGameRoleOption ? (
                          <label className="field compact-field">
                            <span>Название роли</span>
                            <input
                              type="text"
                              value={roleDraft.customRole}
                              placeholder="Например, Старшая медсестра"
                              onChange={(event) => {
                                updateManualRoleDraft(
                                  participant.participantId,
                                  'customRole',
                                  event.target.value,
                                );
                              }}
                              disabled={!hasTeam || isParticipantUpdating || isTeamUpdating}
                            />
                          </label>
                        ) : null}

                        <button
                          type="button"
                          className="primary-button compact-button"
                          onClick={() => {
                            void onAssignManualRole(
                              session.sessionCode,
                              participant.participantId,
                              resolvedRole,
                            );
                          }}
                          disabled={!hasTeam || isParticipantUpdating || isTeamUpdating || !resolvedRole}
                        >
                          {isParticipantUpdating ? 'Назначение...' : 'Назначить роль'}
                        </button>
                      </div>

                      {!hasTeam ? (
                        <p className="participant-team-warning">
                          Сначала назначьте участника в одну из команд, после этого можно будет выдать игровую роль.
                        </p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="waiting-note compact-note">
                <p>В выбранном разделе пока нет участников.</p>
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
