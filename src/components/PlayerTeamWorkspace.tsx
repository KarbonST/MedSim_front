import { useEffect, useRef, useState } from 'react';
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
  const [nowMs, setNowMs] = useState(() => Date.now());
  const knownNotificationIdsRef = useRef<Set<number> | null>(null);
  const [toastNotification, setToastNotification] = useState<PlayerKanbanNotificationItem | null>(null);

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

  const remainingSeconds = getRuntimeRemainingSeconds(workspace.sessionRuntime, nowMs);
  const [chatDraft, setChatDraft] = useState('');
  const { chatState, sendMessage } = usePlayerTeamChat({
    sessionCode: workspace.sessionCode,
    participantId: workspace.participantId,
    enabled: hasTeam,
  });
  const currentStageLabel = workspace.sessionRuntime.activeStageNumber == null
    ? 'Пока не выбран'
    : `Этап ${workspace.sessionRuntime.activeStageNumber}`;

  return (
    <section className="session-room">
      {toastNotification ? (
        <div className="kanban-notification-toast" role="status" aria-live="polite">
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
      />

      <div className="room-hero">
        <div>
          <p className="section-kicker">Сессия</p>
          <h2>{workspace.sessionName}</h2>
        </div>
        <span className="status-pill">{getSessionStatusLabel(workspace.sessionStatus)}</span>
      </div>

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

      <CollapsibleSection
        kicker="Информация о сессии"
        title="Код, участник и роль"
        defaultExpanded={false}
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

      {hasTeam && workspace.gameRole === 'Главный врач' ? (
        <CollapsibleSection
          kicker="План поликлиники"
          title="Кабинеты и количество проблем"
          defaultExpanded
          badge={<span className="status-pill subtle-status-pill">Главный врач</span>}
        >
          <div className="waiting-note compact-note chief-doctor-plan-note">
            <p>На плане видны кабинеты поликлиники, цвет их состояния и количество проблем в каждом помещении.</p>
          </div>
          <ChiefDoctorHospitalPlan
            rooms={workspace.teamEconomy?.rooms ?? []}
          />
        </CollapsibleSection>
      ) : null}

      {hasTeam && teamEconomy ? (
        <CollapsibleSection
          kicker="Ресурсы"
          title="Ресурсы команды"
          defaultExpanded
          badge={(
            <span className="status-pill subtle-status-pill">
              Доступно: {Number(teamEconomy.availableBalance).toFixed(2)}
            </span>
          )}
        >
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
                  <p>Итоги появятся здесь после перехода ведущего к следующему этапу или завершения раунда.</p>
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
                    {workspace.teamInventory.map((item) => (
                      <article key={item.itemName} className="inventory-item-card">
                        <span className="inventory-item-name">{item.itemName}</span>
                        <strong className="inventory-item-quantity">{item.quantity} шт.</strong>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="waiting-note compact-note">
                    <p>
                      {workspace.inventoryVisible
                        ? 'Для вашей команды пока не сформирован стартовый набор предметов.'
                        : 'Детальный склад видят роли с доступом к инвентарю, но бюджет и время доступны всей команде.'}
                    </p>
                  </div>
                )}
                {teamEconomy.reservedItems.length ? (
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
                    <p>Операции появятся после выбора способа решения, согласования задачи или завершения этапа ведущим.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CollapsibleSection>
      ) : null}

      {hasTeam ? (
        <CollapsibleSection
          kicker="Канбан"
          title="Уведомления"
          defaultExpanded={kanbanNotifications.length > 0}
          badge={<span className="status-pill subtle-status-pill">{kanbanNotifications.length}</span>}
        >
          {kanbanNotifications.length ? (
            <div className="kanban-notifications-list">
              {kanbanNotifications.map((notification) => (
                <article key={notification.notificationId} className="kanban-notification-card">
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
              <p>Пока новых уведомлений по задачам нет. Когда вам назначат задачу или она придёт на согласование, это появится здесь.</p>
            </div>
          )}
        </CollapsibleSection>
      ) : null}

      {hasTeam ? (
        <CollapsibleSection
          kicker={chatProblemRoundAvailable ? 'Без доски' : 'Канбан'}
          title={chatProblemRoundAvailable ? 'Проблемы чат-раунда' : 'Доска задач команды'}
          defaultExpanded={kanbanAvailable || chatProblemRoundAvailable}
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
                  Это тренировочный раунд без визуальной доски: проблемы уже влияют на экономику, но статусы придётся
                  держать в голове, в чате и в этом общем списке.
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
              <p>
                Ведущий ещё не выбрал активный этап. Когда этап стартует, проблемы появятся в режиме чат-раунда или канбана.
              </p>
            </div>
          )}
        </CollapsibleSection>
      ) : null}

      {!hasTeam ? (
        <div className="waiting-note">
          <p>
            Сессия уже запущена, но ведущий пока не назначил вам команду. Экран команды появится автоматически сразу
            после распределения.
          </p>
          {loading ? <p className="waiting-note-inline">Проверяем обновления...</p> : null}
          {refreshError ? <p className="form-error waiting-note-inline">{refreshError}</p> : null}
        </div>
      ) : (
        <>
          <CollapsibleSection
            kicker="Чат команды"
            title="Общение команды"
            defaultExpanded
            badge={<span className="status-pill subtle-status-pill">Чат команды</span>}
          >
            <TeamChatFeed
              title={workspace.teamName ?? 'Командный чат'}
              subtitle={workspace.sessionStatus === 'FINISHED'
                ? 'Игра завершена. История переписки доступна для просмотра.'
                : 'Сообщения видны только вашей команде и ведущему.'}
              messages={chatState.messages}
              loading={chatState.loading}
              connectionStatus={chatState.connectionStatus}
              emptyText="Сообщения вашей команды появятся здесь."
              currentParticipantId={workspace.participantId}
              footer={(
                workspace.sessionStatus === 'FINISHED' ? (
                  <p className="participant-role-subtitle team-chat-footer-note">
                    После завершения игры чат остаётся доступным только для просмотра.
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

          <CollapsibleSection
            kicker="Этапы игры"
            title="Текущая конфигурация сессии"
            defaultExpanded={false}
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

          <div className="waiting-note">
            <p>
              {isFinished
                ? 'Сессия завершена. Командный экран оставлен доступным для просмотра итогового состава команды.'
                : 'На экране отображаются только данные вашей команды, текущий этап и общий таймер игры. Информация по другим командам скрыта.'}
            </p>
            {loading ? <p className="waiting-note-inline">Обновляем состояние команды...</p> : null}
            {refreshError ? <p className="form-error waiting-note-inline">{refreshError}</p> : null}
          </div>
        </>
      )}

      <button type="button" className="secondary-button" onClick={onReset}>
        Вернуться на старт
      </button>
    </section>
  );
}

function formatWorkspaceTimestamp(value: string): string {
  return value.replace('T', ' ').slice(0, 16);
}

function getInteractionModeDescription(interactionMode: PlayerTeamWorkspace['sessionRuntime']['activeStageInteractionMode']): string {
  if (interactionMode === 'CHAT_WITH_PROBLEMS') {
    return 'Проблемы уже доступны, но доска скрыта: команда работает через чат и общий список.';
  }

  if (interactionMode === 'CHAT_AND_KANBAN') {
    return 'На этапе доступны чат и канбан-доска команды.';
  }

  return 'Этап пока не выбран.';
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

export default PlayerTeamWorkspaceScreen;
