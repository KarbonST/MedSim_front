import { useState } from 'react';
import type {
  KanbanCardPriority,
  KanbanCardStatus,
  KanbanResponsibleDepartment,
  PlayerKanbanCardUpdateRequest,
  PlayerKanbanSolutionSelectionRequest,
  PlayerTeamWorkspaceMember,
  TeamKanbanBoardItem,
  TeamKanbanCardItem,
} from '../types/app';

interface TeamKanbanBoardProps {
  board: TeamKanbanBoardItem | null;
  updatingCardId?: number | null;
  onUpdateCardStatus?: (cardId: number, payload: PlayerKanbanCardUpdateRequest) => Promise<void>;
  onSelectSolution?: (cardId: number, payload: PlayerKanbanSolutionSelectionRequest) => Promise<void>;
  currentParticipantId?: number;
  currentGameRole?: string | null;
  teamMembers?: PlayerTeamWorkspaceMember[];
  readOnly?: boolean;
  variant?: 'board' | 'flat';
}

interface CardDraft {
  priority?: KanbanCardPriority;
  responsibleDepartment?: KanbanResponsibleDepartment;
  assigneeParticipantId?: number;
}

interface KanbanColumn {
  statuses: KanbanCardStatus[];
  title: string;
  hint: string;
}

const chiefDoctorRole = 'Главный врач';

const statusLabels: Record<KanbanCardStatus, string> = {
  REGISTERED: 'Задача этапа',
  ASSIGNED: 'У руководителя',
  READY_FOR_WORK: 'Назначена исполнителю',
  IN_PROGRESS: 'В процессе',
  DEPARTMENT_REVIEW: 'Проверка подразделения',
  CHIEF_DOCTOR_REVIEW: 'Финальная проверка',
  REWORK: 'Вернулась в задачи этапа',
  DONE: 'Готово',
};

const severityLabels: Record<TeamKanbanCardItem['severity'], string> = {
  MINOR: 'Незначительная',
  SERIOUS: 'Серьёзная',
  CRITICAL: 'Критическая',
};

const priorityOptions: Array<{ value: KanbanCardPriority; label: string }> = [
  { value: 'LOW', label: 'Низкий' },
  { value: 'MEDIUM', label: 'Средний' },
  { value: 'HIGH', label: 'Высокий' },
];

const priorityLabels: Record<KanbanCardPriority, string> = {
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий',
};

const departmentOptions: Array<{ value: KanbanResponsibleDepartment; label: string }> = [
  { value: 'NURSING', label: 'Сестринское подразделение' },
  { value: 'ENGINEERING', label: 'Инженерное подразделение' },
];

const departmentLabels: Record<KanbanResponsibleDepartment, string> = {
  NURSING: 'Сестринское подразделение',
  ENGINEERING: 'Инженерное подразделение',
};

const departmentLeadRoles: Record<KanbanResponsibleDepartment, string> = {
  NURSING: 'Главная медсестра',
  ENGINEERING: 'Главный инженер',
};

const leadRoleDepartments: Record<string, KanbanResponsibleDepartment> = {
  'Главная медсестра': 'NURSING',
  'Главный инженер': 'ENGINEERING',
};

const departmentExecutorRoles: Record<KanbanResponsibleDepartment, string[]> = {
  NURSING: [
    'Главная медсестра',
    'Сестра поликлинического отделения',
    'Сестра диагностического отделения',
  ],
  ENGINEERING: [
    'Главный инженер',
    'Заместитель главного инженера по медтехнике',
    'Заместитель главного инженера по АХЧ',
  ],
};

const columns: KanbanColumn[] = [
  {
    statuses: ['REGISTERED', 'REWORK'],
    title: 'Задачи этапа',
    hint: 'Главврач выбирает приоритет и подразделение',
  },
  {
    statuses: ['ASSIGNED'],
    title: 'К руководителю',
    hint: 'Руководитель подразделения назначает исполнителя',
  },
  {
    statuses: ['READY_FOR_WORK'],
    title: 'К исполнителю',
    hint: 'Исполнитель берёт назначенную задачу в работу',
  },
  {
    statuses: ['IN_PROGRESS'],
    title: 'В процессе',
    hint: 'Исполнитель выполняет задачу',
  },
  {
    statuses: ['DEPARTMENT_REVIEW'],
    title: 'Проверка подразделения',
    hint: 'Первое согласование у руководителя',
  },
  {
    statuses: ['CHIEF_DOCTOR_REVIEW'],
    title: 'Финал у главврача',
    hint: 'Главврач согласует закрытие',
  },
  {
    statuses: ['DONE'],
    title: 'Готово',
    hint: 'Проблема закрыта в экономике',
  },
];

function TeamKanbanBoard({
  board,
  updatingCardId = null,
  onUpdateCardStatus,
  onSelectSolution,
  currentParticipantId,
  currentGameRole = null,
  teamMembers = [],
  readOnly = false,
  variant = 'board',
}: TeamKanbanBoardProps) {
  const cards = board?.cards ?? [];
  const [expandedCardIds, setExpandedCardIds] = useState<Set<number>>(() => new Set());
  const [drafts, setDrafts] = useState<Record<number, CardDraft>>({});
  const [showAllCards, setShowAllCards] = useState(false);
  const currentDepartment = currentGameRole ? leadRoleDepartments[currentGameRole] ?? null : null;
  const isChiefDoctor = currentGameRole === chiefDoctorRole;
  const focusedCards = cards.filter((card) => {
    if (readOnly || isChiefDoctor || !currentParticipantId) {
      return true;
    }

    if (currentDepartment) {
      return card.responsibleDepartment === currentDepartment;
    }

    return card.assigneeParticipantId === currentParticipantId;
  });
  const canSwitchCardScope = !readOnly && !isChiefDoctor && Boolean(currentParticipantId);
  const visibleCards = canSwitchCardScope && showAllCards ? cards : focusedCards;
  const focusScopeLabel = getFocusScopeLabel(currentDepartment);
  const scopeSummary = canSwitchCardScope
    ? `${showAllCards ? 'Вся доска команды' : focusScopeLabel}: ${visibleCards.length} из ${cards.length}`
    : `Видно карточек: ${visibleCards.length}`;

  const toggleCard = (cardId: number): void => {
    setExpandedCardIds((current) => {
      const next = new Set(current);

      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }

      return next;
    });
  };

  const updateDraft = (cardId: number, draft: CardDraft): void => {
    setDrafts((current) => ({
      ...current,
      [cardId]: {
        ...current[cardId],
        ...draft,
      },
    }));
  };

  const getEligibleAssignees = (department: KanbanResponsibleDepartment): PlayerTeamWorkspaceMember[] => {
    const allowedRoles = departmentExecutorRoles[department];

    return teamMembers.filter((member) => (
      member.participantId !== currentParticipantId
      && member.gameRole !== null
      && allowedRoles.includes(member.gameRole)
    ));
  };

  const isCurrentUserDepartmentLead = (department: KanbanResponsibleDepartment | null): boolean => (
    department !== null && currentGameRole === departmentLeadRoles[department]
  );

  const getWaitingHint = (card: TeamKanbanCardItem): string => {
    if (readOnly) {
      return 'Доска открыта в режиме просмотра.';
    }

    if (card.status === 'DONE') {
      return 'Задача уже закрыта.';
    }

    if (card.status === 'REGISTERED' || card.status === 'REWORK') {
      return 'Сейчас ход главврача: нужно выбрать приоритет и подразделение.';
    }

    if (card.status === 'ASSIGNED') {
      return 'Сейчас ход руководителя выбранного подразделения: нужно назначить исполнителя.';
    }

    if (card.status === 'READY_FOR_WORK') {
      return card.assigneeName
        ? `Задача назначена исполнителю: ${card.assigneeName}.`
        : 'Задача назначена исполнителю и ждёт старта работы.';
    }

    if (card.status === 'IN_PROGRESS') {
      return card.assigneeName
        ? `Задача у исполнителя: ${card.assigneeName}.`
        : 'Руководитель уже передал задачу в работу.';
    }

    if (card.status === 'DEPARTMENT_REVIEW') {
      return 'Задача ждёт первого согласования у руководителя подразделения.';
    }

    return 'Задача ждёт финального согласования у главврача.';
  };

  const renderSolutionOptions = (card: TeamKanbanCardItem, isUpdating: boolean) => {
    const options = card.solutionOptions ?? [];

    if (!options.length) {
      return (
        <div className="kanban-solution-panel">
          <strong>Способ решения</strong>
          <p>Для этой задачи пока нет доступных вариантов решения.</p>
        </div>
      );
    }

    return (
      <div className="kanban-solution-panel">
        <div className="kanban-solution-panel-header">
          <strong>Способ решения</strong>
          <span>{formatReservationState(card)}</span>
        </div>

        {options.map((option) => {
          const selected = card.selectedSolutionOptionId === option.solutionOptionId;
          const disabled = isUpdating || selected || !option.selectable || !onSelectSolution;

          return (
            <article
              key={option.solutionOptionId}
              className={selected ? 'kanban-solution-option kanban-solution-option--selected' : 'kanban-solution-option'}
            >
              <div>
                <strong>{option.title}</strong>
                <span>{formatSolutionResources(option)}</span>
              </div>
              {option.description ? <p>{option.description}</p> : null}
              {!option.selectable && option.unavailableReason ? (
                <p className="kanban-solution-warning">{option.unavailableReason}</p>
              ) : null}
              <button
                type="button"
                className={selected ? 'secondary-button compact-button' : 'primary-button compact-button'}
                onClick={() => {
                  if (!onSelectSolution) {
                    return;
                  }

                  void onSelectSolution(card.cardId, { solutionOptionId: option.solutionOptionId });
                }}
                disabled={disabled}
              >
                {selected ? 'Выбрано' : isUpdating ? 'Резервируем...' : 'Выбрать решение'}
              </button>
            </article>
          );
        })}
      </div>
    );
  };

  const renderCardActions = (card: TeamKanbanCardItem) => {
    if (readOnly || !onUpdateCardStatus) {
      return <p className="kanban-card-action-note">{getWaitingHint(card)}</p>;
    }

    const isUpdating = updatingCardId === card.cardId;
    const draft = drafts[card.cardId] ?? {};

    if (card.status === 'REGISTERED' || card.status === 'REWORK') {
      if (currentGameRole !== chiefDoctorRole) {
        return <p className="kanban-card-action-note">{getWaitingHint(card)}</p>;
      }

      const priority = draft.priority ?? card.priority ?? getRecommendedPriority(card.severity);
      const responsibleDepartment = draft.responsibleDepartment
        ?? card.responsibleDepartment
        ?? departmentOptions[0].value;

      return (
        <div className="kanban-card-actions">
          <label className="kanban-action-field">
            <span>Приоритет</span>
            <select
              value={priority}
              onChange={(event) => updateDraft(card.cardId, {
                priority: event.target.value as KanbanCardPriority,
              })}
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="kanban-action-field">
            <span>Подразделение</span>
            <select
              value={responsibleDepartment}
              onChange={(event) => updateDraft(card.cardId, {
                responsibleDepartment: event.target.value as KanbanResponsibleDepartment,
              })}
            >
              {departmentOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="primary-button compact-button"
            onClick={() => {
              void onUpdateCardStatus(card.cardId, {
                status: 'ASSIGNED',
                priority,
                responsibleDepartment,
              });
            }}
            disabled={isUpdating}
          >
            {isUpdating ? 'Передаём...' : 'Передать руководителю'}
          </button>
        </div>
      );
    }

    if (card.status === 'ASSIGNED') {
      if (!card.responsibleDepartment || !isCurrentUserDepartmentLead(card.responsibleDepartment)) {
        return <p className="kanban-card-action-note">{getWaitingHint(card)}</p>;
      }

      const eligibleAssignees = getEligibleAssignees(card.responsibleDepartment);
      const selectedAssigneeId = draft.assigneeParticipantId
        ?? card.assigneeParticipantId
        ?? eligibleAssignees[0]?.participantId;

      return (
        <div className="kanban-card-actions">
          <label className="kanban-action-field">
            <span>Исполнитель</span>
            <select
              value={selectedAssigneeId ?? ''}
              onChange={(event) => updateDraft(card.cardId, {
                assigneeParticipantId: Number(event.target.value),
              })}
            >
              {eligibleAssignees.length ? null : (
                <option value="">Нет подходящих ролей</option>
              )}
              {eligibleAssignees.map((member) => (
                <option key={member.participantId} value={member.participantId}>
                  {member.displayName} · {member.gameRole}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="primary-button compact-button"
            onClick={() => {
              if (!selectedAssigneeId) {
                return;
              }

              void onUpdateCardStatus(card.cardId, {
                status: 'READY_FOR_WORK',
                assigneeParticipantId: selectedAssigneeId,
              });
            }}
            disabled={isUpdating || !selectedAssigneeId}
          >
            {isUpdating ? 'Назначаем...' : 'Назначить исполнителя'}
          </button>
        </div>
      );
    }

    if (card.status === 'READY_FOR_WORK') {
      if (card.assigneeParticipantId !== currentParticipantId) {
        return <p className="kanban-card-action-note">{getWaitingHint(card)}</p>;
      }

      return (
        <div className="kanban-card-actions">
          <button
            type="button"
            className="primary-button compact-button"
            onClick={() => {
              void onUpdateCardStatus(card.cardId, { status: 'IN_PROGRESS' });
            }}
            disabled={isUpdating}
          >
            {isUpdating ? 'Берём...' : 'В работу'}
          </button>
        </div>
      );
    }

    if (card.status === 'IN_PROGRESS') {
      if (card.assigneeParticipantId !== currentParticipantId) {
        return <p className="kanban-card-action-note">{getWaitingHint(card)}</p>;
      }

      const canSendToReview = card.resourcesSpent || card.reservationStatus === 'RESERVED';

      return (
        <div className="kanban-card-actions">
          {renderSolutionOptions(card, isUpdating)}
          <button
            type="button"
            className="primary-button compact-button"
            onClick={() => {
              void onUpdateCardStatus(card.cardId, { status: 'DEPARTMENT_REVIEW' });
            }}
            disabled={isUpdating || !canSendToReview}
          >
            {isUpdating ? 'Отправляем...' : 'Отправить на проверку'}
          </button>
          {!canSendToReview ? (
            <p className="kanban-card-action-note">
              Сначала выберите способ решения: система создаст мягкий резерв ресурсов.
            </p>
          ) : null}
        </div>
      );
    }

    if (card.status === 'DEPARTMENT_REVIEW') {
      if (!isCurrentUserDepartmentLead(card.responsibleDepartment)) {
        return <p className="kanban-card-action-note">{getWaitingHint(card)}</p>;
      }

      return (
        <div className="kanban-card-actions kanban-card-actions--split">
          <button
            type="button"
            className="primary-button compact-button"
            onClick={() => {
              void onUpdateCardStatus(card.cardId, { status: 'CHIEF_DOCTOR_REVIEW' });
            }}
            disabled={isUpdating}
          >
            {isUpdating ? 'Согласуем...' : 'Согласовать и передать главврачу'}
          </button>
          <button
            type="button"
            className="secondary-button compact-button"
            onClick={() => {
              void onUpdateCardStatus(card.cardId, { status: 'REGISTERED' });
            }}
            disabled={isUpdating}
          >
            Вернуть в задачи этапа
          </button>
        </div>
      );
    }

    if (card.status === 'CHIEF_DOCTOR_REVIEW') {
      if (currentGameRole !== chiefDoctorRole) {
        return <p className="kanban-card-action-note">{getWaitingHint(card)}</p>;
      }

      return (
        <div className="kanban-card-actions kanban-card-actions--split">
          <button
            type="button"
            className="primary-button compact-button"
            onClick={() => {
              void onUpdateCardStatus(card.cardId, { status: 'DONE' });
            }}
            disabled={isUpdating}
          >
            {isUpdating ? 'Закрываем...' : 'Финально согласовать'}
          </button>
          <button
            type="button"
            className="secondary-button compact-button"
            onClick={() => {
              void onUpdateCardStatus(card.cardId, { status: 'REGISTERED' });
            }}
            disabled={isUpdating}
          >
            Вернуть в задачи этапа
          </button>
        </div>
      );
    }

    return <p className="kanban-card-action-note">{getWaitingHint(card)}</p>;
  };

  const rolePanel = getRolePanelText({
    readOnly,
    currentGameRole,
    currentDepartment,
    visibleCount: visibleCards.length,
    totalCount: cards.length,
    showingAllCards: canSwitchCardScope && showAllCards,
  });

  if (!cards.length) {
    return (
      <div className="waiting-note compact-note">
        <p>Карточки канбан-доски пока не подготовлены. Обновите экран или попросите ведущего проверить сессию.</p>
      </div>
    );
  }

  if (variant === 'flat') {
    return (
      <>
        <div className="kanban-role-panel kanban-role-panel--flat">
          <div>
            <strong>{rolePanel.title}</strong>
            <p>{rolePanel.description}</p>
          </div>
          <div className="kanban-scope-controls">
            <span>{scopeSummary}</span>
            {canSwitchCardScope ? (
              <button
                type="button"
                className="secondary-button compact-button"
                onClick={() => setShowAllCards((current) => !current)}
              >
                {showAllCards ? `Показать: ${focusScopeLabel.toLowerCase()}` : 'Показать все проблемы'}
              </button>
            ) : null}
          </div>
        </div>

        <div className="team-kanban-flat-list">
          {visibleCards.map((card) => {
            const expanded = expandedCardIds.has(card.cardId);
            const history = card.history ?? [];
            const responsibleDepartmentLabel = card.responsibleDepartment
              ? departmentLabels[card.responsibleDepartment]
              : 'Подразделение не выбрано';
            const priorityLabel = card.priority ? priorityLabels[card.priority] : 'Приоритет не выбран';
            const priorityClass = card.priority ? card.priority.toLowerCase() : 'unprioritized';

            return (
              <article
                key={card.cardId}
                className={`kanban-card kanban-card--${priorityClass} chat-problem-card${expanded ? ' kanban-card--expanded' : ''}`}
              >
                <button
                  type="button"
                  className="kanban-card-summary"
                  aria-expanded={expanded}
                  onClick={() => toggleCard(card.cardId)}
                >
                  <span className="kanban-card-chevron" aria-hidden="true" />
                  <span className="kanban-card-room">{card.roomName}</span>
                  <span className="kanban-card-title">{card.title}</span>
                  <span className="kanban-card-mini-meta">
                    <span>Этап {card.stageNumber}</span>
                    <span>{statusLabels[card.status]}</span>
                    <span>{priorityLabel}</span>
                    <span>{responsibleDepartmentLabel}</span>
                    {card.selectedSolutionTitle ? <span>{formatReservationState(card)}</span> : null}
                    {card.assigneeName ? <span>{card.assigneeName}</span> : null}
                  </span>
                </button>

                {expanded ? (
                  <div className="kanban-card-details">
                    <p>
                      {severityLabels[card.severity]} проблема · кабинет {card.roomCode}. В чат-раунде нет колонок, поэтому
                      состояние задачи приходится восстанавливать по списку и сообщениям.
                    </p>
                    <dl className="kanban-card-facts">
                      <div>
                        <dt>Статус</dt>
                        <dd>{statusLabels[card.status]}</dd>
                      </div>
                      <div>
                        <dt>Подразделение</dt>
                        <dd>{responsibleDepartmentLabel}</dd>
                      </div>
                      <div>
                        <dt>Исполнитель</dt>
                        <dd>{card.assigneeName ?? 'Не назначен'}</dd>
                      </div>
                      <div>
                        <dt>Ресурсы</dt>
                        <dd>{formatCardResources(card)}</dd>
                      </div>
                      <div>
                        <dt>Решение и резерв</dt>
                        <dd>{formatSelectedSolution(card)}</dd>
                      </div>
                    </dl>
                    <div className="kanban-card-history">
                      <h5>Журнал действий</h5>
                      {history.length ? (
                        <ol>
                          {history.map((event) => (
                            <li key={event.eventId}>
                              <time>{formatHistoryTimestamp(event.createdAt)}</time>
                              <span>{event.message}</span>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p>Пока действий нет. Решения придётся проговаривать и фиксировать вручную через этот список.</p>
                      )}
                    </div>
                    {renderCardActions(card)}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="kanban-role-panel">
        <div>
          <strong>{rolePanel.title}</strong>
          <p>{rolePanel.description}</p>
        </div>
        <div className="kanban-scope-controls">
          <span>{scopeSummary}</span>
          {canSwitchCardScope ? (
            <button
              type="button"
              className="secondary-button compact-button"
              onClick={() => setShowAllCards((current) => !current)}
            >
              {showAllCards ? `Показать: ${focusScopeLabel.toLowerCase()}` : 'Показать все карточки'}
            </button>
          ) : null}
        </div>
      </div>
      <div className="team-kanban-board">
      {columns.map((column) => {
        const columnCards = visibleCards.filter((card) => column.statuses.includes(card.status));

        return (
          <section key={column.title} className={`kanban-column kanban-column--${column.statuses[0].toLowerCase()}`}>
            <div className="kanban-column-header">
              <div>
                <h3>{column.title}</h3>
                <p>{column.hint}</p>
              </div>
              <span className="status-pill subtle-status-pill">{columnCards.length}</span>
            </div>

            <div className="kanban-card-list">
              {columnCards.length ? (
                columnCards.map((card) => {
                  const expanded = expandedCardIds.has(card.cardId);
                  const history = card.history ?? [];
                  const responsibleDepartmentLabel = card.responsibleDepartment
                    ? departmentLabels[card.responsibleDepartment]
                    : 'Подразделение не выбрано';
                  const priorityLabel = card.priority ? priorityLabels[card.priority] : 'Приоритет не выбран';
                  const priorityClass = card.priority ? card.priority.toLowerCase() : 'unprioritized';

                  return (
                    <article
                      key={card.cardId}
                      className={`kanban-card kanban-card--${priorityClass}${expanded ? ' kanban-card--expanded' : ''}`}
                    >
                      <button
                        type="button"
                        className="kanban-card-summary"
                        aria-expanded={expanded}
                        onClick={() => toggleCard(card.cardId)}
                      >
                        <span className="kanban-card-chevron" aria-hidden="true" />
                        <span className="kanban-card-room">{card.roomName}</span>
                        <span className="kanban-card-title">{card.title}</span>
                        <span className="kanban-card-mini-meta">
                          <span>Этап {card.stageNumber}</span>
                          <span>{priorityLabel}</span>
                          <span>{responsibleDepartmentLabel}</span>
                          {card.selectedSolutionTitle ? <span>{formatReservationState(card)}</span> : null}
                          {card.assigneeName ? <span>{card.assigneeName}</span> : null}
                        </span>
                      </button>

                      {expanded ? (
                        <div className="kanban-card-details">
                          <p>
                            {severityLabels[card.severity]} проблема · {statusLabels[card.status]} · кабинет {card.roomCode}
                          </p>
                          <dl className="kanban-card-facts">
                            <div>
                              <dt>Подразделение</dt>
                              <dd>{responsibleDepartmentLabel}</dd>
                            </div>
                            <div>
                              <dt>Исполнитель</dt>
                              <dd>{card.assigneeName ?? 'Не назначен'}</dd>
                            </div>
                            <div>
                              <dt>Ресурсы</dt>
                              <dd>{formatCardResources(card)}</dd>
                            </div>
                            <div>
                              <dt>Решение и резерв</dt>
                              <dd>{formatSelectedSolution(card)}</dd>
                            </div>
                          </dl>
                          <div className="kanban-card-history">
                            <h5>История карточки</h5>
                            {history.length ? (
                              <ol>
                                {history.map((event) => (
                                  <li key={event.eventId}>
                                    <time>{formatHistoryTimestamp(event.createdAt)}</time>
                                    <span>{event.message}</span>
                                  </li>
                                ))}
                              </ol>
                            ) : (
                              <p>История появится после первых действий с карточкой.</p>
                            )}
                          </div>
                          {renderCardActions(card)}
                        </div>
                      ) : null}
                    </article>
                  );
                })
              ) : (
                <div className="kanban-empty-column">Пока пусто</div>
              )}
            </div>
          </section>
        );
      })}
      </div>
    </>
  );
}

function getRolePanelText({
  readOnly,
  currentGameRole,
  currentDepartment,
  visibleCount,
  totalCount,
  showingAllCards,
}: {
  readOnly: boolean;
  currentGameRole: string | null;
  currentDepartment: KanbanResponsibleDepartment | null;
  visibleCount: number;
  totalCount: number;
  showingAllCards: boolean;
}): { title: string; description: string } {
  if (readOnly) {
    return {
      title: 'Обзор ведущего',
      description: `Доска открыта только для просмотра: ведущий видит все карточки команды (${visibleCount}) и не меняет статусы.`,
    };
  }

  if (currentGameRole === chiefDoctorRole) {
    return {
      title: 'Разбор задач главврачом',
      description: `Выберите приоритет и ответственное подразделение для задач этапа. Сейчас видно карточек: ${visibleCount}.`,
    };
  }

  if (currentDepartment) {
    return {
      title: 'Назначение исполнителей',
      description: showingAllCards
        ? `Показываем все карточки команды (${totalCount}), но действия доступны только по задачам вашего подразделения.`
        : 'Показываем задачи вашего подразделения: назначайте исполнителей и согласовывайте готовые работы.',
    };
  }

  return {
    title: 'Ваши задачи',
    description: showingAllCards
      ? `Показываем все карточки команды (${totalCount}), а ваши действия доступны только на назначенных вам задачах.`
      : visibleCount
      ? 'Показываем назначенные вам карточки: возьмите задачу в работу и отправьте её на согласование после выполнения.'
      : 'Пока вам не назначили задач. Когда задача появится, она будет здесь и в уведомлениях.',
  };
}

function getFocusScopeLabel(currentDepartment: KanbanResponsibleDepartment | null): string {
  return currentDepartment ? 'Моё подразделение' : 'Мои карточки';
}

function getRecommendedPriority(severity: TeamKanbanCardItem['severity']): KanbanCardPriority {
  if (severity === 'CRITICAL') {
    return 'HIGH';
  }

  if (severity === 'SERIOUS') {
    return 'MEDIUM';
  }

  return 'LOW';
}

function formatCardResources(card: TeamKanbanCardItem): string {
  const parts = [`бюджет ${Number(card.budgetCost).toFixed(2)}`, `время ${card.timeCost}`];

  if (card.requiredItemName && card.requiredItemQuantity > 0) {
    parts.push(`${card.requiredItemName}: ${card.requiredItemQuantity} шт.`);
  }

  return parts.join(' · ');
}

function formatSolutionResources(option: TeamKanbanCardItem['solutionOptions'][number]): string {
  const parts = [`бюджет ${Number(option.budgetCost).toFixed(2)}`, `время ${option.timeCost}`];

  if (option.requiredItemName && option.requiredItemQuantity > 0) {
    parts.push(`${option.requiredItemName}: ${option.requiredItemQuantity} шт.`);
  }

  return parts.join(' · ');
}

function formatReservationState(card: TeamKanbanCardItem): string {
  if (card.resourcesSpent || card.reservationStatus === 'COMMITTED') {
    return 'Ресурсы списаны';
  }

  if (card.reservationStatus === 'RESERVED') {
    return 'Ресурсы в резерве';
  }

  return 'Решение не выбрано';
}

function formatSelectedSolution(card: TeamKanbanCardItem): string {
  if (!card.selectedSolutionTitle) {
    return 'Способ решения ещё не выбран';
  }

  const parts = [
    card.selectedSolutionTitle,
    `бюджет ${Number(card.reservedBudgetAmount).toFixed(2)}`,
    `время ${card.reservedTimeUnits}`,
  ];

  if (card.reservedItemName && card.reservedItemQuantity > 0) {
    parts.push(`${card.reservedItemName}: ${card.reservedItemQuantity} шт.`);
  }

  return `${formatReservationState(card)} · ${parts.join(' · ')}`;
}

function formatHistoryTimestamp(value: string): string {
  return value.replace('T', ' ').slice(0, 16);
}

export default TeamKanbanBoard;
