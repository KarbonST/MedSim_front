import { useEffect, useState } from 'react';
import { commonGameRoles, customGameRoleOption } from '../constants/gameRoles';
import { stageInteractionModes } from '../constants/stageInteractionModes';
import type {
  GameSessionInventorySettingsRequest,
  GameSessionParticipantsResponse,
  GameSessionStageSettingsRequest,
  SessionEconomySettings,
  SessionInventoryItem,
  SessionParticipantSummary,
  SessionStageSetting,
  SessionTeamSummary,
  StageInteractionMode,
} from '../types/app';
import CollapsibleSection from './CollapsibleSection';

interface SessionSetupPanelProps {
  session: GameSessionParticipantsResponse;
  visibleSection?: 'all' | 'economy' | 'teams' | 'stages' | 'inventory';
  loading: boolean;
  autoTeamAssignmentLoading: boolean;
  randomAssignmentLoading: boolean;
  savingStages: boolean;
  economySettings: SessionEconomySettings | null;
  economyLoading: boolean;
  economySaving: boolean;
  inventorySaving: boolean;
  teamRenameId: number | null;
  teamAssignmentParticipantId: number | null;
  roleAssignmentParticipantId: number | null;
  removingParticipantId: number | null;
  onRenameTeam: (
    sessionCode: string,
    teamId: number,
    teamName: string,
  ) => void | Promise<void>;
  onAutoAssignTeams: (sessionCode: string) => void | Promise<void>;
  onAssignParticipantTeam: (
    sessionCode: string,
    participantId: number,
    teamId: number | null,
  ) => void | Promise<void>;
  onRemoveParticipant: (
    sessionCode: string,
    participantId: number,
  ) => void | Promise<void>;
  onSaveStages: (
    sessionCode: string,
    request: GameSessionStageSettingsRequest,
  ) => void | Promise<void>;
  onSaveEconomySettings: (
    sessionCode: string,
    startingBudget: string,
    stageTimeUnits: number,
  ) => void | Promise<void>;
  onSaveInventorySettings: (
    sessionCode: string,
    request: GameSessionInventorySettingsRequest,
  ) => void | Promise<void>;
  onRandomizeInventory: (sessionCode: string) => void | Promise<void>;
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

interface RoleParticipantGroup {
  key: string;
  title: string;
  team: SessionTeamSummary | null;
  participants: SessionParticipantSummary[];
}

const DEFAULT_SESSION_STAGE_COUNT = 3;

function buildEvenProblemDistribution(totalProblemCount: number, stageCount: number): number[] {
  if (stageCount < 1) {
    return [];
  }

  const baseCount = Math.floor(totalProblemCount / stageCount);
  const remainder = totalProblemCount % stageCount;

  return Array.from({ length: stageCount }, (_, index) => baseCount + (index < remainder ? 1 : 0));
}

function createDefaultStages(totalProblemCount: number): SessionStageSetting[] {
  const problemDistribution = buildEvenProblemDistribution(totalProblemCount, DEFAULT_SESSION_STAGE_COUNT);

  return Array.from({ length: DEFAULT_SESSION_STAGE_COUNT }, (_, index) => ({
    stageNumber: index + 1,
    durationMinutes: 15,
    interactionMode: index === 0 ? 'CHAT_WITH_PROBLEMS' : 'CHAT_AND_KANBAN',
    problemCount: problemDistribution[index] ?? 0,
  }));
}

function buildStageDrafts(session: GameSessionParticipantsResponse): SessionStageSetting[] {
  if (!session.stages.length) {
    return createDefaultStages(session.totalProblemCount);
  }

  return [...session.stages].sort((left, right) => left.stageNumber - right.stageNumber);
}

function buildInventoryDrafts(items: SessionInventoryItem[]): Record<string, string> {
  return items.reduce<Record<string, string>>((drafts, item) => {
    drafts[item.itemName] = String(item.quantity);
    return drafts;
  }, {});
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

function buildTeamRoleParticipantGroups(
  participants: SessionParticipantSummary[],
  teams: SessionTeamSummary[],
): RoleParticipantGroup[] {
  if (!teams.length) {
    return [{
      key: 'mixed-participants',
      title: 'Все игроки',
      team: null,
      participants,
    }];
  }

  const groups: RoleParticipantGroup[] = [];
  const participantsWithoutTeam = participants.filter((participant) => participant.teamId === null);

  if (participantsWithoutTeam.length > 0) {
    groups.push({
      key: 'without-team',
      title: 'Игроки без команды',
      team: null,
      participants: participantsWithoutTeam,
    });
  }

  [...teams]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .forEach((team) => {
      groups.push({
        key: `team-${team.teamId}`,
        title: team.teamName,
        team,
        participants: participants.filter((participant) => participant.teamId === team.teamId),
      });
    });

  return groups;
}

function SessionSetupPanel({
  session,
  visibleSection = 'all',
  loading,
  autoTeamAssignmentLoading,
  randomAssignmentLoading,
  savingStages,
  economySettings,
  economyLoading,
  economySaving,
  inventorySaving,
  teamRenameId,
  teamAssignmentParticipantId,
  roleAssignmentParticipantId,
  removingParticipantId,
  onRenameTeam,
  onAutoAssignTeams,
  onAssignParticipantTeam,
  onRemoveParticipant,
  onSaveStages,
  onSaveEconomySettings,
  onSaveInventorySettings,
  onRandomizeInventory,
  onAssignRandomRoles,
  onAssignManualRole,
}: SessionSetupPanelProps) {
  const [stageDrafts, setStageDrafts] = useState<SessionStageSetting[]>(() => buildStageDrafts(session));
  const [budgetDraft, setBudgetDraft] = useState(() => (economySettings ? economySettings.startingBudget.toFixed(2) : '15.00'));
  const [stageTimeUnitsDraft, setStageTimeUnitsDraft] = useState(() => (economySettings ? String(economySettings.stageTimeUnits) : '15'));
  const [manualRoleDrafts, setManualRoleDrafts] = useState<Record<number, ManualRoleDraft>>(() => (
    buildManualRoleDrafts(session.participants)
  ));
  const [teamNameDrafts, setTeamNameDrafts] = useState<Record<number, string>>(() => buildTeamNameDrafts(session));
  const [participantTeamDrafts, setParticipantTeamDrafts] = useState<Record<number, string>>(() => (
    buildParticipantTeamDrafts(session.participants)
  ));
  const [manualProblemDistribution, setManualProblemDistribution] = useState(false);
  const [inventoryDrafts, setInventoryDrafts] = useState<Record<string, string>>(() => (
    buildInventoryDrafts(session.inventoryItems)
  ));
  const [expandedRoleParticipantIds, setExpandedRoleParticipantIds] = useState<Set<number>>(() => new Set());
  const [collapsedTeamRoleGroupKeys, setCollapsedTeamRoleGroupKeys] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setStageDrafts(buildStageDrafts(session));
  }, [session.sessionId, session.stages, session.totalProblemCount]);

  useEffect(() => {
    setManualProblemDistribution(false);
  }, [session.sessionId]);

  useEffect(() => {
    setManualRoleDrafts(buildManualRoleDrafts(session.participants));
    setParticipantTeamDrafts(buildParticipantTeamDrafts(session.participants));
  }, [session.sessionId, session.participants]);

  useEffect(() => {
    setExpandedRoleParticipantIds((current) => {
      const availableParticipantIds = new Set(session.participants.map((participant) => participant.participantId));
      const nextExpandedParticipantIds = new Set<number>();
      let hasRemovedParticipant = false;

      current.forEach((participantId) => {
        if (availableParticipantIds.has(participantId)) {
          nextExpandedParticipantIds.add(participantId);
          return;
        }

        hasRemovedParticipant = true;
      });

      return hasRemovedParticipant ? nextExpandedParticipantIds : current;
    });
  }, [session.sessionId, session.participants]);

  useEffect(() => {
    setTeamNameDrafts(buildTeamNameDrafts(session));
  }, [session.sessionId, session.teams]);

  useEffect(() => {
    setInventoryDrafts(buildInventoryDrafts(session.inventoryItems));
  }, [session.sessionId, session.inventoryItems]);

  useEffect(() => {
    if (!economySettings) {
      return;
    }

    setBudgetDraft(economySettings.startingBudget.toFixed(2));
    setStageTimeUnitsDraft(String(economySettings.stageTimeUnits));
  }, [economySettings]);

  const isLobby = session.sessionStatus === 'LOBBY';
  const assignedTeamParticipantsCount = session.participants.filter((participant) => participant.teamId !== null).length;
  const parsedBudget = Number.parseFloat(budgetDraft.replace(',', '.'));
  const parsedStageTimeUnits = Number.parseInt(stageTimeUnitsDraft, 10);
  const isEconomyDraftValid = Number.isFinite(parsedBudget) && parsedBudget >= 0.01 && !Number.isNaN(parsedStageTimeUnits) && parsedStageTimeUnits >= 1;
  const normalizedDraftBudget = isEconomyDraftValid ? parsedBudget.toFixed(2) : '';
  const normalizedCurrentBudget = economySettings ? Number(economySettings.startingBudget).toFixed(2) : '';
  const isEconomyDraftChanged = economySettings
    ? normalizedDraftBudget !== normalizedCurrentBudget || parsedStageTimeUnits !== economySettings.stageTimeUnits
    : false;
  const teamRoleParticipantGroups = buildTeamRoleParticipantGroups(session.participants, session.teams);
  const totalProblemCount = session.totalProblemCount ?? 0;
  const autoProblemDistribution = buildEvenProblemDistribution(totalProblemCount, DEFAULT_SESSION_STAGE_COUNT);
  const visibleProblemDistribution = manualProblemDistribution
    ? stageDrafts.map((stage) => stage.problemCount ?? 0)
    : autoProblemDistribution;
  const distributedProblemCount = visibleProblemDistribution.reduce((sum, count) => sum + count, 0);
  const remainingProblemCount = totalProblemCount - distributedProblemCount;
  const isProblemDistributionValid = !manualProblemDistribution || remainingProblemCount === 0;
  const inventoryItems = session.inventoryItems ?? [];
  const isInventoryDraftValid = inventoryItems.every((item) => {
    const value = Number.parseInt(inventoryDrafts[item.itemName] ?? '', 10);
    return !Number.isNaN(value) && value >= 0;
  });

  const handleSaveEconomy = async (): Promise<void> => {
    if (!economySettings || !isEconomyDraftValid) {
      return;
    }

    await onSaveEconomySettings(
      session.sessionCode,
      parsedBudget.toFixed(2),
      parsedStageTimeUnits,
    );
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
    if (!isProblemDistributionValid) {
      return;
    }

    await onSaveStages(session.sessionCode, {
      stages: stageDrafts.map((stage, index) => ({
        stageNumber: index + 1,
        durationMinutes: stage.durationMinutes,
        interactionMode: stage.interactionMode,
        ...(manualProblemDistribution ? { problemCount: stage.problemCount ?? 0 } : {}),
      })),
    });
  };

  const toggleManualProblemDistribution = (): void => {
    if (manualProblemDistribution) {
      setStageDrafts(createDefaultStages(totalProblemCount));
    }

    setManualProblemDistribution((current) => !current);
  };

  const updateInventoryDraft = (itemName: string, quantity: string): void => {
    setInventoryDrafts((current) => ({
      ...current,
      [itemName]: quantity,
    }));
  };

  const handleSaveInventory = async (): Promise<void> => {
    if (!isInventoryDraftValid) {
      return;
    }

    await onSaveInventorySettings(session.sessionCode, {
      items: inventoryItems.map((item) => ({
        itemName: item.itemName,
        quantity: Number.parseInt(inventoryDrafts[item.itemName] ?? '0', 10),
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
    const teamDraft = participantTeamDrafts[participantId] ?? '';
    const selectedTeamId = teamDraft === '' ? null : Number.parseInt(teamDraft, 10);

    if (selectedTeamId !== null && Number.isNaN(selectedTeamId)) {
      return;
    }

    await onAssignParticipantTeam(session.sessionCode, participantId, selectedTeamId);
  };

  const toggleRoleParticipantExpanded = (participantId: number): void => {
    setExpandedRoleParticipantIds((current) => {
      const nextExpandedParticipantIds = new Set(current);

      if (nextExpandedParticipantIds.has(participantId)) {
        nextExpandedParticipantIds.delete(participantId);
      } else {
        nextExpandedParticipantIds.add(participantId);
      }

      return nextExpandedParticipantIds;
    });
  };

  const toggleTeamRoleGroupCollapsed = (groupKey: string): void => {
    setCollapsedTeamRoleGroupKeys((current) => {
      const nextCollapsedGroupKeys = new Set(current);

      if (nextCollapsedGroupKeys.has(groupKey)) {
        nextCollapsedGroupKeys.delete(groupKey);
      } else {
        nextCollapsedGroupKeys.add(groupKey);
      }

      return nextCollapsedGroupKeys;
    });
  };

  const renderRoleParticipantCard = (participant: SessionParticipantSummary) => {
    const roleDraft = manualRoleDrafts[participant.participantId] ?? {
      selectedRole: '',
      customRole: '',
    };
    const resolvedRole = resolveGameRole(participant.participantId);
    const isParticipantUpdating = roleAssignmentParticipantId === participant.participantId;
    const isTeamUpdating = teamAssignmentParticipantId === participant.participantId;
    const teamDraft = participantTeamDrafts[participant.participantId] ?? '';
    const hasTeam = participant.teamId !== null;
    const isExpanded = expandedRoleParticipantIds.has(participant.participantId);
    const currentGameRole = participant.gameRole ?? 'Пока не назначена';
    const currentTeamDraft = participant.teamId === null ? '' : String(participant.teamId);
    const isTeamDraftChanged = teamDraft !== currentTeamDraft;
    const teamActionLabel = hasTeam && teamDraft === '' ? 'Убрать из команды' : 'Переместить';
    const isParticipantRemoving = removingParticipantId === participant.participantId;

    return (
      <article
        key={participant.participantId}
        className={`participant-card participant-role-card${isExpanded ? ' participant-role-card--expanded' : ''}`}
      >
        <button
          type="button"
          className="participant-role-card-toggle"
          onClick={() => toggleRoleParticipantExpanded(participant.participantId)}
          aria-expanded={isExpanded}
        >
          <span className="participant-role-card-summary">
            <strong>{participant.displayName}</strong>
            <span className="participant-role-compact-role">
              Игровая роль: {currentGameRole}
            </span>
          </span>
          <span
            className={`collapsible-section-chevron participant-role-card-chevron${isExpanded ? ' collapsible-section-chevron--expanded' : ''}`}
            aria-hidden="true"
          />
        </button>

        {isExpanded ? (
          <div className="participant-role-card-body">
            <p className="participant-role-subtitle">
              Реальная должность: {participant.hospitalPosition}
            </p>

            <dl className="participant-details participant-management-details">
              <div>
                <dt>Команда</dt>
                <dd>{participant.teamName ?? 'Пока не назначена'}</dd>
              </div>
              <div>
                <dt>Текущая игровая роль</dt>
                <dd>{currentGameRole}</dd>
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
                disabled={!isLobby || isTeamUpdating || isParticipantRemoving || !isTeamDraftChanged}
              >
                {isTeamUpdating ? 'Перенос...' : teamActionLabel}
              </button>

              <button
                type="button"
                className="danger-button compact-button"
                onClick={() => {
                  void onRemoveParticipant(session.sessionCode, participant.participantId);
                }}
                disabled={!isLobby || isTeamUpdating || isParticipantUpdating || isParticipantRemoving}
              >
                {isParticipantRemoving ? 'Исключение...' : 'Исключить'}
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
                  disabled={!isLobby || isParticipantUpdating || isParticipantRemoving || !hasTeam}
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
                    disabled={!isLobby || isParticipantUpdating || isParticipantRemoving || !hasTeam}
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
                disabled={!isLobby || isParticipantUpdating || isParticipantRemoving || !resolvedRole || !hasTeam}
              >
                {isParticipantUpdating ? 'Назначение...' : 'Назначить роль'}
              </button>
            </div>

            {!hasTeam ? (
              <p className="participant-team-warning">
                Чтобы назначить роль, сначала выберите команду участника.
              </p>
            ) : null}
          </div>
        ) : null}
      </article>
    );
  };

  return (
    <div className="session-setup-stack">
      {(visibleSection === 'all' || visibleSection === 'economy') ? (
        <CollapsibleSection
          kicker="Стартовые ресурсы"
          title="Бюджет и время команд"
          defaultExpanded
          badge={(
            <span className="status-pill subtle-status-pill">
              {economySettings
                ? `Бюджет: ${Number(economySettings.startingBudget).toFixed(2)} · Время: ${economySettings.stageTimeUnits}`
                : 'Загрузка...'}
            </span>
          )}
        >
          <div className="waiting-note">
            <p>Стартовый бюджет и временной ресурс для всех команд.</p>
          </div>

          <div className="setup-toolbar">
            <label className="field compact-field stage-count-field">
              <span>Стартовый бюджет</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={budgetDraft}
                onChange={(event) => setBudgetDraft(event.target.value)}
                disabled={!isLobby || economySaving || economyLoading}
              />
            </label>

            <label className="field compact-field stage-count-field">
              <span>Временной ресурс команды</span>
              <input
                type="number"
                min="1"
                value={stageTimeUnitsDraft}
                onChange={(event) => setStageTimeUnitsDraft(event.target.value)}
                disabled={!isLobby || economySaving || economyLoading}
              />
            </label>

            <button
              type="button"
              className="primary-button"
              onClick={() => {
                void handleSaveEconomy();
              }}
              disabled={!isLobby || economySaving || economyLoading || !economySettings || !isEconomyDraftValid || !isEconomyDraftChanged}
            >
              {economySaving ? 'Сохранение...' : 'Сохранить ресурсы'}
            </button>
          </div>

          {!isEconomyDraftValid ? (
            <p className="participant-role-subtitle">
              Укажите бюджет не меньше 0.01 и временной ресурс не меньше 1.
            </p>
          ) : null}
        </CollapsibleSection>
      ) : null}

      {(visibleSection === 'all' || visibleSection === 'teams') ? (
        <CollapsibleSection
          kicker="Команды и роли"
          title="Настройка команд"
          defaultExpanded
          actions={(
            <>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  void onAutoAssignTeams(session.sessionCode);
                }}
                disabled={!isLobby || autoTeamAssignmentLoading || loading || session.participants.length === 0}
              >
                {autoTeamAssignmentLoading ? 'Распределение...' : 'Распределить по командам случайно'}
              </button>
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
            </>
          )}
        >
          <div className="waiting-note">
            <p>Распределение игроков, команд и ролей.</p>
          </div>

          <div className="team-role-groups">
            {teamRoleParticipantGroups.map((group) => {
              const isGroupCollapsed = collapsedTeamRoleGroupKeys.has(group.key);
              const assignedRolesCount = group.participants.filter((participant) => participant.gameRole).length;
              const draftName = group.team ? (teamNameDrafts[group.team.teamId] ?? group.team.teamName) : '';

              return (
                <article
                  key={group.key}
                  className={`team-role-group${isGroupCollapsed ? '' : ' team-role-group--expanded'}`}
                >
                  <button
                    type="button"
                    className="team-role-group-toggle"
                    onClick={() => toggleTeamRoleGroupCollapsed(group.key)}
                    aria-expanded={!isGroupCollapsed}
                  >
                    <span className="team-role-group-title">
                      <strong>{group.title}</strong>
                      <span>
                        {group.participants.length > 0
                          ? `Игроков: ${group.participants.length} · Ролей: ${assignedRolesCount}/${group.participants.length}`
                          : 'Пока нет игроков'}
                      </span>
                    </span>
                    <span
                      className={`collapsible-section-chevron team-role-group-chevron${isGroupCollapsed ? '' : ' collapsible-section-chevron--expanded'}`}
                      aria-hidden="true"
                    />
                  </button>

                  {!isGroupCollapsed ? (
                    <div className="team-role-group-body">
                      {group.team ? (
                        <div className="team-edit-form team-role-name-form">
                          <label className="field compact-field">
                            <span>Название команды</span>
                            <input
                              type="text"
                              value={draftName}
                              onChange={(event) => {
                                if (!group.team) {
                                  return;
                                }

                                setTeamNameDrafts((current) => ({
                                  ...current,
                                  [group.team.teamId]: event.target.value,
                                }));
                              }}
                              disabled={!isLobby || teamRenameId === group.team.teamId}
                            />
                          </label>

                          <button
                            type="button"
                            className="primary-button compact-button"
                            onClick={() => {
                              if (!group.team) {
                                return;
                              }

                              void handleRenameTeam(group.team.teamId, group.team.teamName);
                            }}
                            disabled={
                              !isLobby
                              || teamRenameId === group.team.teamId
                              || !draftName.trim()
                              || draftName.trim() === group.team.teamName
                            }
                          >
                            {teamRenameId === group.team.teamId ? 'Сохранение...' : 'Сохранить название'}
                          </button>
                        </div>
                      ) : (
                        <div className="waiting-note waiting-note-inline">
                          <p>Игроки без команды.</p>
                        </div>
                      )}

                      {group.participants.length > 0 ? (
                        <div className="participants-list role-management-list">
                          {group.participants.map((participant) => renderRoleParticipantCard(participant))}
                        </div>
                      ) : (
                        <div className="waiting-note waiting-note-inline">
                          <p>Команда пока пустая.</p>
                        </div>
                      )}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </CollapsibleSection>
      ) : null}

      {(visibleSection === 'all' || visibleSection === 'stages') ? (
        <CollapsibleSection
          kicker="Параметры игры"
          title="Настройка этапов сессии"
          defaultExpanded={false}
          badge={(
            <span className="status-pill subtle-status-pill">
              Этапов: {DEFAULT_SESSION_STAGE_COUNT}
            </span>
          )}
        >
          <div className="setup-toolbar">
            <div className="waiting-note waiting-note-inline fixed-stage-note">
              <p>Этапов всегда 3. Меняются только время и задачи.</p>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={() => {
                void handleSaveStages();
              }}
              disabled={!isLobby || savingStages || loading || !isProblemDistributionValid}
            >
              {savingStages ? 'Сохранение...' : 'Сохранить этапы'}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={toggleManualProblemDistribution}
              disabled={!isLobby || savingStages}
            >
              {manualProblemDistribution ? 'Автоматическое распределение' : 'Ручное распределение задач'}
            </button>
          </div>

          <div className="waiting-note compact-note">
            <p>
              {manualProblemDistribution
                ? `Распределено ${distributedProblemCount} из ${totalProblemCount}. ${
                  remainingProblemCount === 0
                    ? 'Можно сохранять.'
                    : remainingProblemCount > 0
                      ? `Осталось распределить ${remainingProblemCount}.`
                      : `Лишних задач: ${Math.abs(remainingProblemCount)}.`
                }`
                : `Задачи распределятся автоматически и почти поровну: ${visibleProblemDistribution.join(' / ')}.`}
            </p>
          </div>

          {!isLobby ? (
            <div className="waiting-note">
              <p>После старта этапы заблокированы.</p>
            </div>
          ) : null}

          <div className="stage-editors">
            {stageDrafts.map((stage, index) => (
              <article key={stage.stageNumber} className="stage-editor-card">
                <div className="stage-editor-header">
                  <strong>Этап {stage.stageNumber}</strong>
                  <span className="stage-editor-hint">
                    Настройка длительности таймера и доступных инструментов
                  </span>
                </div>

                <div className="stage-editor-grid">
                  <label className="field compact-field">
                    <span>Длительность этапа, мин.</span>
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

                  <label className="field compact-field">
                    <span>Задач на этапе</span>
                    <input
                      type="number"
                      min="0"
                      value={manualProblemDistribution ? stage.problemCount ?? 0 : autoProblemDistribution[index] ?? 0}
                      onChange={(event) => {
                        const nextValue = Number.parseInt(event.target.value, 10);

                        if (Number.isNaN(nextValue) || nextValue < 0) {
                          return;
                        }

                        updateStageDraft(stage.stageNumber, 'problemCount', nextValue);
                      }}
                      disabled={!isLobby || savingStages || !manualProblemDistribution}
                    />
                  </label>
                </div>

                <p className="stage-editor-description">
                  {stageInteractionModes.find((mode) => mode.value === stage.interactionMode)?.hint}
                </p>
              </article>
            ))}
          </div>
        </CollapsibleSection>
      ) : null}

      {(visibleSection === 'all' || visibleSection === 'inventory') ? (
        <CollapsibleSection
          kicker="Ресурсы"
          title="Стартовый склад"
          defaultExpanded={false}
          badge={(
            <span className="status-pill subtle-status-pill">
              Позиций: {inventoryItems.length}
            </span>
          )}
        >
          <div className="waiting-note">
            <p>Одинаковый стартовый склад для всех команд.</p>
          </div>

          <div className="setup-toolbar">
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                void onRandomizeInventory(session.sessionCode);
              }}
              disabled={!isLobby || inventorySaving || loading}
            >
              {inventorySaving ? 'Обновление...' : 'Сформировать случайно'}
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={() => {
                void handleSaveInventory();
              }}
              disabled={!isLobby || inventorySaving || loading || !isInventoryDraftValid}
            >
              {inventorySaving ? 'Сохранение...' : 'Сохранить склад'}
            </button>
          </div>

          {!isInventoryDraftValid ? (
            <p className="form-error">Количество на складе должно быть целым числом от 0 и выше.</p>
          ) : null}

          <div className="team-inventory-grid">
            {inventoryItems.map((item) => (
              <article key={item.itemName} className="inventory-item-card">
                <label className="field compact-field">
                  <span>{item.itemName}</span>
                  <input
                    type="number"
                    min="0"
                    value={inventoryDrafts[item.itemName] ?? '0'}
                    onChange={(event) => updateInventoryDraft(item.itemName, event.target.value)}
                    disabled={!isLobby || inventorySaving}
                  />
                </label>
              </article>
            ))}
          </div>
        </CollapsibleSection>
      ) : null}

    </div>
  );
}

export default SessionSetupPanel;
