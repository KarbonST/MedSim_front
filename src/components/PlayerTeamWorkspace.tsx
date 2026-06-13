import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  PlayerKanbanNotificationItem,
  PlayerKanbanCardUpdateRequest,
  PlayerKanbanSolutionSelectionRequest,
  PlayerTeamWorkspace,
} from '../types/app';
import BrandHeader from './BrandHeader';
import { getSessionStatusLabel } from '../constants/sessionStatuses';
import { formatRuntimeDuration, getInteractionModeLabel, getRuntimeRemainingSeconds, getTimerStatusLabel } from '../lib/sessionRuntime';
import CollapsibleSection from './CollapsibleSection';
import TeamChatFeed from './TeamChatFeed';
import { usePlayerTeamChat } from '../hooks/usePlayerTeamChat';
import ChiefDoctorHospitalPlan from './ChiefDoctorHospitalPlan';
import TeamKanbanBoard from './TeamKanbanBoard';
import MenuToggleButton from './MenuToggleButton';
import WorkspaceDrawer from './WorkspaceDrawer';

type PlayerWorkspaceView =
  | 'overview'
  | 'runtime'
  | 'notifications'
  | 'chat'
  | 'plan'
  | 'resources'
  | 'board'
  | 'team'
  | 'stages';

interface PlayerTeamWorkspaceProps {
  workspace: PlayerTeamWorkspace;
  loading: boolean;
  refreshError: string;
  kanbanActionId: number | null;
  onUpdateKanbanCardStatus: (cardId: number, payload: PlayerKanbanCardUpdateRequest) => Promise<void>;
  onSelectKanbanCardSolution: (cardId: number, payload: PlayerKanbanSolutionSelectionRequest) => Promise<void>;
  onReset: () => void;
}

function PlayerTeamWorkspaceScreen({
  workspace,
  loading,
  refreshError,
  kanbanActionId,
  onUpdateKanbanCardStatus,
  onSelectKanbanCardSolution,
  onReset,
}: PlayerTeamWorkspaceProps) {
  const isFinished = workspace.sessionStatus === 'FINISHED';
  const hasTeam = workspace.teamId !== null;
  const kanbanAvailable = workspace.sessionRuntime.activeStageInteractionMode === 'CHAT_AND_KANBAN';
  const chatProblemRoundAvailable = workspace.sessionRuntime.activeStageInteractionMode === 'CHAT_WITH_PROBLEMS';
  const kanbanNotifications = workspace.kanbanNotifications ?? [];
  const teamEconomy = workspace.teamEconomy;
  const stageSummaries = teamEconomy?.stageSummaries ?? [];
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState<PlayerWorkspaceView>(hasTeam ? 'runtime' : 'overview');
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [runtimeSyncedAtMs, setRuntimeSyncedAtMs] = useState<number | null>(() => Date.now());
  const knownNotificationIdsRef = useRef<Set<number> | null>(null);
  const [toastNotification, setToastNotification] = useState<PlayerKanbanNotificationItem | null>(null);

  useEffect(() => {
    setRuntimeSyncedAtMs(Date.now());
  }, [
    workspace.sessionRuntime.activeStageNumber,
    workspace.sessionRuntime.timerStatus,
    workspace.sessionRuntime.remainingSeconds,
  ]);

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

  useEffect(() => {
    const currentIds = new Set(kanbanNotifications.map((notification) => notification.notificationId));

    if (knownNotificationIdsRef.current === null) {
      knownNotificationIdsRef.current = currentIds;
      return;
    }

    const freshNotifications = kanbanNotifications.filter(
      (notification) => !knownNotificationIdsRef.current?.has(notification.notificationId),
    );

    if (freshNotifications.length) {
      setToastNotification(freshNotifications[0]);
    }

    currentIds.forEach((notificationId) => {
      knownNotificationIdsRef.current?.add(notificationId);
    });
  }, [kanbanNotifications]);

  useEffect(() => {
    if (!toastNotification) {
      return;
    }

    const toastTimerId = window.setTimeout(() => {
      setToastNotification(null);
    }, 3200);

    return () => {
      window.clearTimeout(toastTimerId);
    };
  }, [toastNotification]);

  const remainingSeconds = getRuntimeRemainingSeconds(
    workspace.sessionRuntime,
    nowMs,
    runtimeSyncedAtMs,
  );
  const [chatDraft, setChatDraft] = useState('');
  const { chatState, sendMessage } = usePlayerTeamChat({
    sessionCode: workspace.sessionCode,
    participantId: workspace.participantId,
    enabled: hasTeam,
  });
  const currentStageLabel = workspace.sessionRuntime.activeStageNumber == null
    ? 'Пока не выбран'
    : `Этап ${workspace.sessionRuntime.activeStageNumber}`;
  const toastNotificationClassName = toastNotification
    ? getNotificationClassName(toastNotification.type, 'kanban-notification-toast')
    : 'kanban-notification-toast';
  const playerNavSections = useMemo(() => {
    const primaryItems = [
      {
        id: 'overview' as const,
        label: 'Обзор',
        description: 'Код, участник, команда и роль',
      },
      ...(hasTeam ? [{
        id: 'runtime' as const,
        label: 'Этап и таймер',
        description: 'Текущее состояние игрового этапа',
      }] : []),
    ];
    const collaborationItems = hasTeam ? [
      {
        id: 'notifications' as const,
        label: 'Уведомления',
        description: 'Изменения и новые события',
      },
      {
        id: 'chat' as const,
        label: 'Чат команды',
        description: 'Общение внутри команды',
      },
      ...(workspace.gameRole === 'Главный врач' ? [{
        id: 'plan' as const,
        label: 'План кабинетов',
        description: 'Загрузка кабинетов и проблемы',
      }] : []),
      ...(teamEconomy ? [{
        id: 'resources' as const,
        label: 'Ресурсы',
        description: 'Бюджет, время и склад',
      }] : []),
      {
        id: 'board' as const,
        label: 'Карточки задач',
        description: 'Канбан-доска или чат-раунд',
      },
      {
        id: 'team' as const,
        label: 'Команда',
        description: 'Состав вашей команды',
      },
      {
        id: 'stages' as const,
        label: 'Этапы',
        description: 'Конфигурация текущей сессии',
      },
    ] : [];

    return [
      {
        title: 'Основное',
        items: primaryItems,
      },
      {
        title: 'Командная работа',
        items: collaborationItems,
      },
    ];
  }, [hasTeam, teamEconomy, workspace.gameRole]);
  const availableViews = useMemo(
    () => playerNavSections.flatMap((section) => section.items),
    [playerNavSections],
  );
  const activeNavItem = availableViews.find((item) => item.id === activeView);

  useEffect(() => {
    setActiveView((current) => {
      if (availableViews.some((item) => item.id === current)) {
        return current;
      }

      return hasTeam ? 'runtime' : 'overview';
    });
  }, [availableViews, hasTeam]);

  const renderOverviewPanel = () => (
    <>
      <CollapsibleSection
        kicker="Информация о сессии"
        title="Код, участник и роль"
        defaultExpanded
      >
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
      </CollapsibleSection>

      <div className="waiting-note compact-note">
        <p>
          {!hasTeam
            ? 'Команда ещё не назначена. Экран обновится после распределения.'
            : isFinished
              ? 'Игра завершена. Экран доступен только для просмотра.'
              : 'Показаны только данные вашей команды.'}
        </p>
      </div>
    </>
  );

  const renderRuntimePanel = () => (
    <CollapsibleSection
      kicker="Ход игры"
      title="Текущий этап и время"
      className="player-runtime-panel"
      defaultExpanded
      badge={(
        <span className="status-pill subtle-status-pill runtime-status-pill">
          {getTimerStatusLabel(workspace.sessionRuntime.timerStatus)}
        </span>
      )}
    >
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
    </CollapsibleSection>
  );

  const renderNotificationsPanel = () => (
    <CollapsibleSection
      kicker="Канбан"
      title="Уведомления"
      defaultExpanded
      badge={<span className="status-pill subtle-status-pill">{kanbanNotifications.length}</span>}
    >
      {kanbanNotifications.length ? (
        <div className="kanban-notifications-list">
          {kanbanNotifications.map((notification) => (
            <article
              key={notification.notificationId}
              className={getNotificationClassName(notification.type, 'kanban-notification-card')}
            >
              <div>
                <strong>{notification.title}</strong>
                <time>{formatWorkspaceTimestamp(notification.createdAt)}</time>
              </div>
              <p>{notification.message}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="waiting-note compact-note">
          <p>Новых уведомлений нет.</p>
        </div>
      )}
    </CollapsibleSection>
  );

  const renderChatPanel = () => (
    <CollapsibleSection
      kicker="Чат команды"
      title="Общение команды"
      defaultExpanded
      badge={<span className="status-pill subtle-status-pill">Чат команды</span>}
    >
      <TeamChatFeed
        title={workspace.teamName ?? 'Командный чат'}
        subtitle={workspace.sessionStatus === 'FINISHED'
          ? 'История чата'
          : 'Сообщения видны только команде и ведущему.'}
        messages={chatState.messages}
        loading={chatState.loading}
        connectionStatus={chatState.connectionStatus}
        emptyText="Сообщения вашей команды появятся здесь."
        currentParticipantId={workspace.participantId}
        footer={(
          workspace.sessionStatus === 'FINISHED' ? (
            <p className="participant-role-subtitle team-chat-footer-note">
              Чат доступен только для просмотра.
            </p>
          ) : (
            <form
              className="team-chat-composer"
              onSubmit={(event) => {
                event.preventDefault();
                const sent = sendMessage(chatDraft);
                if (sent) {
                  setChatDraft('');
                }
              }}
            >
              <textarea
                value={chatDraft}
                onChange={(event) => setChatDraft(event.target.value)}
                placeholder="Напишите сообщение для своей команды"
                rows={3}
              />
              <button
                type="submit"
                className="primary-button compact-button"
                disabled={!chatDraft.trim()}
              >
                Отправить
              </button>
            </form>
          )
        )}
      />
      {chatState.error ? <p className="form-error">{chatState.error}</p> : null}
    </CollapsibleSection>
  );

  const renderPlanPanel = () => (
    <CollapsibleSection
      kicker="План поликлиники"
      title="Кабинеты и количество проблем"
      defaultExpanded
      badge={<span className="status-pill subtle-status-pill">Главный врач</span>}
    >
      <div className="waiting-note compact-note chief-doctor-plan-note">
        <p>Кабинеты, активные проблемы и критичные задачи команды.</p>
      </div>
      <ChiefDoctorHospitalPlan
        rooms={workspace.teamEconomy?.rooms ?? []}
      />
    </CollapsibleSection>
  );

  const renderResourcesPanel = () => (
    <CollapsibleSection
      kicker="Ресурсы"
      title="Ресурсы команды"
      defaultExpanded
      badge={(
        <span className="status-pill subtle-status-pill">
          Доступно: {Number(teamEconomy?.availableBalance ?? 0).toFixed(2)}
        </span>
      )}
    >
      {teamEconomy ? (
        <div className="team-resources-panel">
          <div className="team-resources-grid">
            <article className="info-card team-resource-card">
              <span>Бюджет</span>
              <strong>{Number(teamEconomy.currentBalance).toFixed(2)}</strong>
            </article>
            <article className="info-card team-resource-card">
              <span>Время этапа</span>
              <strong>{teamEconomy.currentStageTimeUnits}</strong>
            </article>
            <article className="info-card team-resource-card">
              <span>В резерве</span>
              <strong>{Number(teamEconomy.reservedBudget).toFixed(2)} · {teamEconomy.reservedStageTimeUnits}</strong>
            </article>
            <article className="info-card team-resource-card">
              <span>Доступно</span>
              <strong>{Number(teamEconomy.availableBalance).toFixed(2)} · {teamEconomy.availableStageTimeUnits}</strong>
            </article>
            <article className="info-card team-resource-card">
              <span>Доход / расходы</span>
              <strong>
                {Number(teamEconomy.totalIncome).toFixed(2)} / {Number(teamEconomy.totalExpenses).toFixed(2)}
              </strong>
            </article>
            <article className="info-card team-resource-card">
              <span>Штрафы / бонусы</span>
              <strong>
                {Number(teamEconomy.totalPenalties).toFixed(2)} / {Number(teamEconomy.totalBonuses).toFixed(2)}
              </strong>
            </article>
          </div>

          <div className="team-stage-summary-panel">
            <div className="team-resource-subpanel-header">
              <strong>Итоги этапов/раундов</strong>
              <span>{stageSummaries.length ? `Закрыто: ${stageSummaries.length}` : 'Пока нет итогов'}</span>
            </div>
            {stageSummaries.length ? (
              <div className="team-stage-summary-list">
                {stageSummaries.map((summary) => (
                  <article key={`${summary.stageNumber}-${summary.settledAt}`} className="team-stage-summary-card">
                    <div className="team-stage-summary-card-header">
                      <strong>Этап {summary.stageNumber}</strong>
                      <span>{formatSignedNumber(summary.netAmount)}</span>
                    </div>
                    <p>{summary.message}</p>
                    <time>Зафиксировано: {formatWorkspaceTimestamp(summary.settledAt)}</time>
                  </article>
                ))}
              </div>
            ) : (
              <div className="waiting-note compact-note">
                <p>Итоги этапов появятся после расчёта.</p>
              </div>
            )}
          </div>

          <div className="team-resources-columns">
            <div className="team-resource-subpanel">
              <div className="team-resource-subpanel-header">
                <strong>Склад</strong>
                <span>{workspace.inventoryVisible ? `Позиций: ${workspace.teamInventory.length}` : 'Ограниченный доступ'}</span>
              </div>
              {workspace.inventoryVisible && workspace.teamInventory.length ? (
                <div className="team-inventory-grid">
                  {workspace.teamInventory.map((item) => {
                    const reservedQuantity = getReservedItemQuantity(teamEconomy.reservedItems, item.itemName);
                    const availableQuantity = item.quantity - reservedQuantity;

                    return (
                      <article key={item.itemName} className="inventory-item-card">
                        <span className="inventory-item-name">{item.itemName}</span>
                        <strong className="inventory-item-quantity">{item.quantity} шт.</strong>
                        {reservedQuantity > 0 ? (
                          <span className="inventory-item-reserve">
                            В резерве {reservedQuantity} · доступно {availableQuantity}
                          </span>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="waiting-note compact-note">
                  <p>
                    {workspace.inventoryVisible
                      ? 'Стартовый склад ещё не заполнен.'
                      : 'Склад и резервы доступны только руководящим ролям.'}
                  </p>
                </div>
              )}
              {workspace.inventoryVisible && teamEconomy.reservedItems.length ? (
                <div className="team-reserved-items-note">
                  <strong>В резерве:</strong>
                  <span>
                    {teamEconomy.reservedItems
                      .map((item) => `${item.itemName}: ${item.quantity} шт.`)
                      .join(' · ')}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="team-resource-subpanel">
              <div className="team-resource-subpanel-header">
                <strong>Последние операции</strong>
                <span>{teamEconomy.recentEvents.length}</span>
              </div>
              {teamEconomy.recentEvents.length ? (
                <div className="team-economy-event-list">
                  {teamEconomy.recentEvents.map((event) => (
                    <article key={event.eventId} className="team-economy-event-card">
                      <div>
                        <strong>{event.message}</strong>
                        <time>{formatWorkspaceTimestamp(event.createdAt)}</time>
                      </div>
                      <span>
                        Бюджет {formatSignedNumber(event.amountDelta)} · время {formatSignedInteger(event.timeDelta)}
                        {event.itemName ? ` · ${event.itemName} ${formatSignedInteger(event.itemQuantityDelta)} шт.` : ''}
                      </span>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="waiting-note compact-note">
                  <p>Операции появятся после решений и расчёта этапа.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="waiting-note compact-note">
          <p>Ресурсы команды появятся после инициализации экономики.</p>
        </div>
      )}
    </CollapsibleSection>
  );

  const renderBoardPanel = () => (
    <CollapsibleSection
      kicker={chatProblemRoundAvailable ? 'Без доски' : 'Канбан'}
      title={chatProblemRoundAvailable ? 'Проблемы чат-раунда' : 'Доска задач команды'}
      defaultExpanded
      badge={(
        <span className="status-pill subtle-status-pill">
          {kanbanAvailable ? 'Доступна' : chatProblemRoundAvailable ? 'Чат-раунд' : 'Ждёт этапа'}
        </span>
      )}
    >
      {kanbanAvailable ? (
        <TeamKanbanBoard
          board={workspace.teamKanbanBoard}
          updatingCardId={kanbanActionId}
          onUpdateCardStatus={onUpdateKanbanCardStatus}
          onSelectSolution={onSelectKanbanCardSolution}
          currentParticipantId={workspace.participantId}
          currentGameRole={workspace.gameRole}
          teamMembers={workspace.teammates}
          teamEconomy={teamEconomy}
          teamInventory={workspace.teamInventory}
        />
      ) : chatProblemRoundAvailable ? (
        <>
          <div className="waiting-note compact-note chat-round-note">
            <p>
              Раунд без доски: задачи идут через чат и общий список.
            </p>
          </div>
          <TeamKanbanBoard
            board={workspace.teamKanbanBoard}
            updatingCardId={kanbanActionId}
            onUpdateCardStatus={onUpdateKanbanCardStatus}
            onSelectSolution={onSelectKanbanCardSolution}
            currentParticipantId={workspace.participantId}
            currentGameRole={workspace.gameRole}
            teamMembers={workspace.teammates}
            teamEconomy={teamEconomy}
            teamInventory={workspace.teamInventory}
            variant="flat"
          />
        </>
      ) : (
        <div className="waiting-note compact-note">
          <p>Этап ещё не запущен.</p>
        </div>
      )}
    </CollapsibleSection>
  );

  const renderTeamPanel = () => (
    <CollapsibleSection
      kicker="Состав команды"
      title="Только ваша команда"
      defaultExpanded
      badge={<span className="status-pill subtle-status-pill">Участников: {workspace.teammates.length}</span>}
    >
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
                <dt>Игровая должность</dt>
                <dd>{member.gameRole ?? 'Назначается ведущим'}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </CollapsibleSection>
  );

  const renderStagesPanel = () => (
    <CollapsibleSection
      kicker="Этапы игры"
      title="Текущая конфигурация сессии"
      defaultExpanded
    >
      <div className="stage-editors workspace-stage-list">
        {workspace.stages.map((stage) => (
          <article key={stage.stageNumber} className="stage-editor-card workspace-stage-card">
            <div className="stage-editor-header">
              <strong>Этап {stage.stageNumber}</strong>
              <span className="stage-editor-hint">{stage.durationMinutes} мин.</span>
            </div>
            <p className="stage-editor-description">
              {getInteractionModeDescription(stage.interactionMode)}
            </p>
          </article>
        ))}
      </div>
    </CollapsibleSection>
  );

  const renderActivePanel = () => {
    switch (activeView) {
      case 'overview':
        return renderOverviewPanel();
      case 'runtime':
        return renderRuntimePanel();
      case 'notifications':
        return renderNotificationsPanel();
      case 'chat':
        return renderChatPanel();
      case 'plan':
        return renderPlanPanel();
      case 'resources':
        return renderResourcesPanel();
      case 'board':
        return renderBoardPanel();
      case 'team':
        return renderTeamPanel();
      case 'stages':
        return renderStagesPanel();
      default:
        return null;
    }
  };

  return (
    <section className="session-room">
      {toastNotification ? (
        <div className={toastNotificationClassName} role="status" aria-live="polite">
          <div>
            <span>Новое уведомление</span>
            <strong>{toastNotification.title}</strong>
            <p>{toastNotification.message}</p>
          </div>
          <button
            type="button"
            aria-label="Скрыть уведомление"
            onClick={() => setToastNotification(null)}
          >
            x
          </button>
        </div>
      ) : null}

      <BrandHeader
        compact
        eyebrow="Игровое пространство команды"
        title={hasTeam ? workspace.teamName ?? 'Командный экран' : 'Ожидание назначения команды'}
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
          <h2>{workspace.sessionName}</h2>
        </div>
        <span className="status-pill">{getSessionStatusLabel(workspace.sessionStatus)}</span>
      </div>

      <div className="workspace-page-indicator">
        <div>
          <span className="section-kicker">Открыт раздел</span>
          <strong>{activeNavItem?.label ?? 'Рабочее пространство'}</strong>
        </div>
        <span className="status-pill subtle-status-pill">
          {loading ? 'Обновление...' : !hasTeam ? 'Ожидание команды' : isFinished ? 'Только просмотр' : 'Команда активна'}
        </span>
      </div>

      {refreshError ? <p className="form-error workspace-inline-error">{refreshError}</p> : null}

      {renderActivePanel()}

      <WorkspaceDrawer
        open={menuOpen}
        title={hasTeam ? workspace.teamName ?? 'Меню команды' : 'Меню участника'}
        subtitle={`${workspace.displayName} · ${workspace.sessionCode}`}
        sections={playerNavSections.map((section) => ({
          ...section,
          items: section.items.map((item) => ({
            ...item,
            active: activeView === item.id,
          })),
        }))}
        footer={(
          <button type="button" className="secondary-button" onClick={onReset}>
            Вернуться на старт
          </button>
        )}
        onSelect={(viewId) => setActiveView(viewId as PlayerWorkspaceView)}
        onClose={() => setMenuOpen(false)}
      />
    </section>
  );
}

function formatWorkspaceTimestamp(value: string): string {
  return value.replace('T', ' ').slice(0, 16);
}

function getNotificationClassName(type: PlayerKanbanNotificationItem['type'], baseClassName: string): string {
  if (type === 'SOLUTION_FAILED') {
    return `${baseClassName} ${baseClassName}--warning`;
  }

  return baseClassName;
}

function getInteractionModeDescription(interactionMode: PlayerTeamWorkspace['sessionRuntime']['activeStageInteractionMode']): string {
  if (interactionMode === 'CHAT_WITH_PROBLEMS') {
    return 'Чат и общий список задач.';
  }

  if (interactionMode === 'CHAT_AND_KANBAN') {
    return 'Чат и канбан-доска.';
  }

  return 'Этап не выбран.';
}

function formatSignedNumber(value: number): string {
  const numberValue = Number(value);

  if (numberValue > 0) {
    return `+${numberValue.toFixed(2)}`;
  }

  if (numberValue < 0) {
    return numberValue.toFixed(2);
  }

  return '0';
}

function formatSignedInteger(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }

  return `${value}`;
}

function getReservedItemQuantity(
  reservedItems: NonNullable<PlayerTeamWorkspace['teamEconomy']>['reservedItems'],
  itemName: string,
): number {
  const reservedItem = reservedItems.find(
    (item) => item.itemName.toLowerCase() === itemName.toLowerCase(),
  );

  return reservedItem?.quantity ?? 0;
}

export default PlayerTeamWorkspaceScreen;
