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
  randomAssignmentLoading: boolean;
  savingStages: boolean;
  roleAssignmentParticipantId: number | null;
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

function SessionSetupPanel({
  session,
  loading,
  randomAssignmentLoading,
  savingStages,
  roleAssignmentParticipantId,
  onSaveStages,
  onAssignRandomRoles,
  onAssignManualRole,
}: SessionSetupPanelProps) {
  const [stageDrafts, setStageDrafts] = useState<SessionStageSetting[]>(() => buildStageDrafts(session));
  const [manualRoleDrafts, setManualRoleDrafts] = useState<Record<number, ManualRoleDraft>>(() => (
    buildManualRoleDrafts(session.participants)
  ));

  useEffect(() => {
    setStageDrafts(buildStageDrafts(session));
  }, [session.sessionId, session.stages]);

  useEffect(() => {
    setManualRoleDrafts(buildManualRoleDrafts(session.participants));
  }, [session.sessionId, session.participants]);

  const isLobby = session.sessionStatus === 'LOBBY';

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

  return (
    <div className="session-setup-stack">
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
            <p>После старта игры настройки этапов и ролей блокируются. Сейчас сессия уже не в режиме ожидания.</p>
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
            disabled={!isLobby || randomAssignmentLoading || loading || session.participants.length < 3}
          >
            {randomAssignmentLoading ? 'Распределение...' : 'Распределить случайно'}
          </button>
        </div>

        <div className="waiting-note">
          <p>
            Автораспределение гарантирует роли главного врача, главной медсестры и главного инженера,
            избегая совпадения с реальной должностью участника. Для этого нужно минимум 3 игрока.
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

                <dl className="participant-details">
                  <div>
                    <dt>Текущая игровая роль</dt>
                    <dd>{participant.gameRole ?? 'Пока не назначена'}</dd>
                  </div>
                </dl>

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
                      disabled={!isLobby || isParticipantUpdating}
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
                        disabled={!isLobby || isParticipantUpdating}
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
                    disabled={!isLobby || isParticipantUpdating || !resolvedRole}
                  >
                    {isParticipantUpdating ? 'Назначение...' : 'Назначить'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SessionSetupPanel;
