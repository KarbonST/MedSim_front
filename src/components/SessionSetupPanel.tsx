import type { ChangeEvent } from 'react';
import { useEffect, useState } from 'react';
import { commonGameRoles, customGameRoleOption } from '../constants/gameRoles';
import { stageInteractionModes } from '../constants/stageInteractionModes';
import type {
  GameSessionParticipantsResponse,
  GameSessionStageSettingsRequest,
  SessionParticipantSummary,
  SessionStageSetting,
  StageInteractionMode,
} from '../types/app';

interface SessionSetupPanelProps {
  session: GameSessionParticipantsResponse;
  loading: boolean;
  autoTeamAssignmentLoading: boolean;
  randomAssignmentLoading: boolean;
  savingStages: boolean;
  teamRenameId: number | null;
  teamAssignmentParticipantId: number | null;
  roleAssignmentParticipantId: number | null;
  onRenameTeam: (
    sessionCode: string,
    teamId: number,
    teamName: string,
  ) => void | Promise<void>;
  onAutoAssignTeams: (sessionCode: string) => void | Promise<void>;
  onAssignParticipantTeam: (
    sessionCode: string,
    participantId: number,
    teamId: number,
  ) => void | Promise<void>;
  onSaveStages: (
    sessionCode: string,
    request: GameSessionStageSettingsRequest,
  ) => void | Promise<void>;
  onAssignRandomRoles: (sessionCode: string) => void | Promise<void>;
  onAssignManualRole: (
    sessionCode: string,
    participantId: number,
    gameRole: string,
  ) => void | Promise<void>;
}

interface ManualRoleDraft {
  selectedRole: string;
  customRole: string;
}

function createDefaultStages(count: number): SessionStageSetting[] {
  return Array.from({ length: count }, (_, index) => ({
    stageNumber: index + 1,
    durationMinutes: 15,
    interactionMode: index === 0 ? 'CHAT_ONLY' : 'CHAT_AND_KANBAN',
  }));
}

function buildStageDrafts(session: GameSessionParticipantsResponse): SessionStageSetting[] {
  if (!session.stages.length) {
    return createDefaultStages(2);
  }

  return [...session.stages].sort((left, right) => left.stageNumber - right.stageNumber);
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

function buildTeamNameDrafts(session: GameSessionParticipantsResponse): Record<number, string> {
  return session.teams.reduce<Record<number, string>>((drafts, team) => {
    drafts[team.teamId] = team.teamName;
    return drafts;
  }, {});
}

function buildParticipantTeamDrafts(
  participants: SessionParticipantSummary[],
): Record<number, string> {
  return participants.reduce<Record<number, string>>((drafts, participant) => {
    drafts[participant.participantId] = participant.teamId ? String(participant.teamId) : '';
    return drafts;
  }, {});
}

function SessionSetupPanel({
  session,
  loading,
  autoTeamAssignmentLoading,
  randomAssignmentLoading,
  savingStages,
  teamRenameId,
  teamAssignmentParticipantId,
  roleAssignmentParticipantId,
  onRenameTeam,
  onAutoAssignTeams,
  onAssignParticipantTeam,
  onSaveStages,
  onAssignRandomRoles,
  onAssignManualRole,
}: SessionSetupPanelProps) {
  const [stageDrafts, setStageDrafts] = useState<SessionStageSetting[]>(() => buildStageDrafts(session));
  const [manualRoleDrafts, setManualRoleDrafts] = useState<Record<number, ManualRoleDraft>>(() => (
    buildManualRoleDrafts(session.participants)
  ));
  const [teamNameDrafts, setTeamNameDrafts] = useState<Record<number, string>>(() => buildTeamNameDrafts(session));
  const [participantTeamDrafts, setParticipantTeamDrafts] = useState<Record<number, string>>(() => (
    buildParticipantTeamDrafts(session.participants)
  ));

  useEffect(() => {
    setStageDrafts(buildStageDrafts(session));
  }, [session.sessionId, session.stages]);

  useEffect(() => {
    setManualRoleDrafts(buildManualRoleDrafts(session.participants));
    setParticipantTeamDrafts(buildParticipantTeamDrafts(session.participants));
  }, [session.sessionId, session.participants]);

  useEffect(() => {
    setTeamNameDrafts(buildTeamNameDrafts(session));
  }, [session.sessionId, session.teams]);

  const isLobby = session.sessionStatus === 'LOBBY';
  const assignedTeamParticipantsCount = session.participants.filter((participant) => participant.teamId !== null).length;

  const handleStageCountChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const requestedCount = Number.parseInt(event.target.value, 10);

    if (Number.isNaN(requestedCount) || requestedCount < 1) {
      return;
    }

    setStageDrafts((current) => {
      if (requestedCount === current.length) {
        return current;
      }

      if (requestedCount < current.length) {
        return current.slice(0, requestedCount);
      }

      const extension = createDefaultStages(requestedCount).slice(current.length);
      return [...current, ...extension];
    });
  };

  const updateStageDraft = (
    stageNumber: number,
    field: keyof SessionStageSetting,
    value: number | StageInteractionMode,
  ): void => {
    setStageDrafts((current) => current.map((stage) => {
      if (stage.stageNumber !== stageNumber) {
        return stage;
      }

      return {
        ...stage,
        [field]: value,
      };
    }));
  };

  const handleSaveStages = async (): Promise<void> => {
    await onSaveStages(session.sessionCode, {
      stages: stageDrafts.map((stage, index) => ({
        stageNumber: index + 1,
        durationMinutes: stage.durationMinutes,
        interactionMode: stage.interactionMode,
      })),
    });
  };

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

  const handleRenameTeam = async (teamId: number, originalName: string): Promise<void> => {
    const nextName = (teamNameDrafts[teamId] ?? '').trim();

    if (!nextName || nextName === originalName) {
      return;
    }

    await onRenameTeam(session.sessionCode, teamId, nextName);
  };

  const handleAssignTeam = async (participantId: number): Promise<void> => {
    const selectedTeamId = Number.parseInt(participantTeamDrafts[participantId] ?? '', 10);

    if (Number.isNaN(selectedTeamId)) {
      return;
    }

    await onAssignParticipantTeam(session.sessionCode, participantId, selectedTeamId);
  };

  return (
    <div className="session-setup-stack">
      <div className="participants-panel">
        <div className="participants-panel-header">
          <div>
            <p className="section-kicker">Команды</p>
            <h3>Состав и настройка команд</h3>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              void onAutoAssignTeams(session.sessionCode);
            }}
            disabled={!isLobby || autoTeamAssignmentLoading || loading || session.participants.length === 0}
          >
            {autoTeamAssignmentLoading ? 'Распределение...' : 'Распределить по командам'}
          </button>
        </div>

        <div className="waiting-note">
          <p>
            При создании сессии команды получают случайные тематические названия. Здесь ведущий может переименовать
            команды и распределить игроков вручную или автоматически. Автораспределение учитывает уже назначенных
            игроков и добирает остальных максимально поровну.
          </p>
        </div>

        <div className="team-cards">
          {session.teams.map((team) => {
            const draftName = teamNameDrafts[team.teamId] ?? team.teamName;

            return (
              <article key={team.teamId} className="team-card">
                <div className="team-card-header">
                  <div>
                    <span className="team-order-badge">Команда {team.sortOrder}</span>
                    <strong>{team.teamName}</strong>
                  </div>
                  <span className="status-pill subtle-status-pill">Игроков: {team.memberCount}</span>
                </div>

                <div className="team-edit-form">
                  <label className="field compact-field">
                    <span>Название команды</span>
                    <input
                      type="text"
                      value={draftName}
                      onChange={(event) => {
                        setTeamNameDrafts((current) => ({
                          ...current,
                          [team.teamId]: event.target.value,
                        }));
                      }}
                      disabled={!isLobby || teamRenameId === team.teamId}
                    />
                  </label>

                  <button
                    type="button"
                    className="primary-button compact-button"
                    onClick={() => {
                      void handleRenameTeam(team.teamId, team.teamName);
                    }}
                    disabled={
                      !isLobby
                      || teamRenameId === team.teamId
                      || !draftName.trim()
                      || draftName.trim() === team.teamName
                    }
                  >
                    {teamRenameId === team.teamId ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="participants-panel">
        <div className="participants-panel-header">
          <div>
            <p className="section-kicker">Параметры игры</p>
            <h3>Настройка этапов сессии</h3>
          </div>

          <div className="setup-badge-row">
            <span className="status-pill subtle-status-pill">
              Этапов: {stageDrafts.length}
            </span>
          </div>
        </div>

        <div className="setup-toolbar">
          <label className="field compact-field stage-count-field">
            <span>Количество этапов</span>
            <input
              type="number"
              min="1"
              value={stageDrafts.length}
              onChange={handleStageCountChange}
              disabled={!isLobby || savingStages}
            />
          </label>

          <button
            type="button"
            className="primary-button"
            onClick={() => {
              void handleSaveStages();
            }}
            disabled={!isLobby || savingStages || loading}
          >
            {savingStages ? 'Сохранение...' : 'Сохранить этапы'}
          </button>
        </div>

        {!isLobby ? (
          <div className="waiting-note">
            <p>После старта игры настройки этапов, команд и ролей блокируются. Сейчас сессия уже не в режиме ожидания.</p>
          </div>
        ) : null}

        <div className="stage-editors">
          {stageDrafts.map((stage) => (
            <article key={stage.stageNumber} className="stage-editor-card">
              <div className="stage-editor-header">
                <strong>Этап {stage.stageNumber}</strong>
                <span className="stage-editor-hint">
                  Настройка длительности и доступных инструментов
                </span>
              </div>

              <div className="stage-editor-grid">
                <label className="field compact-field">
                  <span>Время этапа, мин.</span>
                  <input
                    type="number"
                    min="1"
                    value={stage.durationMinutes}
                    onChange={(event) => {
                      const nextValue = Number.parseInt(event.target.value, 10);

                      if (Number.isNaN(nextValue) || nextValue < 1) {
                        return;
                      }

                      updateStageDraft(stage.stageNumber, 'durationMinutes', nextValue);
                    }}
                    disabled={!isLobby || savingStages}
                  />
                </label>

                <label className="field compact-field">
                  <span>Инструменты этапа</span>
                  <select
                    value={stage.interactionMode}
                    onChange={(event) => {
                      updateStageDraft(
                        stage.stageNumber,
                        'interactionMode',
                        event.target.value as StageInteractionMode,
                      );
                    }}
                    disabled={!isLobby || savingStages}
                  >
                    {stageInteractionModes.map((mode) => (
                      <option key={mode.value} value={mode.value}>
                        {mode.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <p className="stage-editor-description">
                {stageInteractionModes.find((mode) => mode.value === stage.interactionMode)?.hint}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div className="participants-panel">
        <div className="participants-panel-header">
          <div>
            <p className="section-kicker">Игровые роли</p>
            <h3>Распределение по участникам</h3>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              void onAssignRandomRoles(session.sessionCode);
            }}
            disabled={!isLobby || randomAssignmentLoading || loading || assignedTeamParticipantsCount < 3}
          >
            {randomAssignmentLoading ? 'Распределение...' : 'Распределить роли случайно'}
          </button>
        </div>

        <div className="waiting-note">
          <p>
            Игровые роли можно выдавать только участникам, у которых уже выбрана команда. Автораспределение ролей
            гарантирует главного врача, главную медсестру и главного инженера и избегает совпадения с реальной
            должностью игрока. Для этого нужно минимум 3 участника, уже распределённых по командам.
          </p>
        </div>

        <div className="participants-list role-management-list">
          {session.participants.map((participant, index) => {
            const roleDraft = manualRoleDrafts[participant.participantId] ?? {
              selectedRole: '',
              customRole: '',
            };
            const resolvedRole = resolveGameRole(participant.participantId);
            const isParticipantUpdating = roleAssignmentParticipantId === participant.participantId;
            const isTeamUpdating = teamAssignmentParticipantId === participant.participantId;
            const teamDraft = participantTeamDrafts[participant.participantId] ?? '';
            const hasTeam = participant.teamId !== null;

            return (
              <article key={participant.participantId} className="participant-card participant-role-card">
                <div className="participant-card-header">
                  <span className="participant-index">#{index + 1}</span>
                  <div>
                    <strong>{participant.displayName}</strong>
                    <p className="participant-role-subtitle">
                      Реальная должность: {participant.hospitalPosition}
                    </p>
                  </div>
                </div>

                <dl className="participant-details participant-management-details">
                  <div>
                    <dt>Команда</dt>
                    <dd>{participant.teamName ?? 'Пока не назначена'}</dd>
                  </div>
                  <div>
                    <dt>Текущая игровая роль</dt>
                    <dd>{participant.gameRole ?? 'Пока не назначена'}</dd>
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
                      disabled={!isLobby || isTeamUpdating}
                    >
                      <option value="">Выберите команду</option>
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
                    disabled={!isLobby || isTeamUpdating || !teamDraft}
                  >
                    {isTeamUpdating ? 'Назначение...' : 'Назначить команду'}
                  </button>
                </div>

                <div className="participant-role-form">
                  <label className="field compact-field">
                    <span>Выбор роли</span>
                    <select
                      value={roleDraft.selectedRole}
                      onChange={(event) => {
                        updateManualRoleDraft(
                          participant.participantId,
                          'selectedRole',
                          event.target.value,
                        );
                      }}
                      disabled={!isLobby || isParticipantUpdating || !hasTeam}
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
                        disabled={!isLobby || isParticipantUpdating || !hasTeam}
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
                    disabled={!isLobby || isParticipantUpdating || !resolvedRole || !hasTeam}
                  >
                    {isParticipantUpdating ? 'Назначение...' : 'Назначить роль'}
                  </button>
                </div>

                {!hasTeam ? (
                  <p className="participant-team-warning">
                    Сначала выберите команду для участника, после этого станет доступно назначение игровой роли.
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SessionSetupPanel;
