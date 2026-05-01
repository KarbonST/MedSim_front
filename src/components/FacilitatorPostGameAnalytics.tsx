import { useMemo, useState } from 'react';
import { getInteractionModeLabel } from '../lib/sessionRuntime';
import { downloadGameSessionAnalyticsExport } from '../services/gameSessionsApi';
import type {
  GameSessionAnalyticsResponse,
  TeamAnalyticsCardItem,
  TeamAnalyticsItem,
} from '../types/app';
import CollapsibleSection from './CollapsibleSection';

interface FacilitatorPostGameAnalyticsProps {
  sessionCode: string;
  authHeader: string;
  analytics: GameSessionAnalyticsResponse | null;
  loading: boolean;
  onRefreshAnalytics: (sessionCode: string) => void | Promise<void>;
}

const dateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const analyticsCardStatusLabels: Record<string, string> = {
  REGISTERED: 'Задача этапа',
  ASSIGNED: 'На распределении',
  READY_FOR_WORK: 'Исполнитель назначен',
  IN_PROGRESS: 'В работе',
  DEPARTMENT_REVIEW: 'Проверка подразделения',
  CHIEF_DOCTOR_REVIEW: 'Финальное согласование',
  REWORK: 'Возвращена в задачи этапа',
  HOLD: 'Отложена',
  DONE: 'Закрыта',
};

function formatMoney(value: number): string {
  return value.toFixed(2);
}

function formatDuration(seconds: number | null): string {
  if (seconds == null) {
    return '—';
  }

  const safeSeconds = Math.max(seconds, 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return '—';
  }

  return dateTimeFormatter.format(new Date(value));
}

function sliceTopCards(cards: TeamAnalyticsCardItem[]): TeamAnalyticsCardItem[] {
  return cards.slice(0, 5);
}

function getAnalyticsCardStatusLabel(card: TeamAnalyticsCardItem): string {
  if (card.resolved || card.status === 'DONE') {
    return 'Закрыта';
  }

  return analyticsCardStatusLabels[card.status] ?? card.status;
}

function TeamTopCards({ team }: { team: TeamAnalyticsItem }) {
  const topCards = useMemo(() => sliceTopCards(team.cards), [team.cards]);

  return (
    <div className="analytics-table-wrap">
      <table className="analytics-table">
        <thead>
          <tr>
            <th>Проблема</th>
            <th>Статус</th>
            <th>Возвраты</th>
            <th>Hold</th>
            <th>Полный цикл</th>
          </tr>
        </thead>
        <tbody>
          {topCards.map((card) => (
            <tr key={card.cardId}>
              <td>
                <strong>{card.problemNumber}. {card.title}</strong>
                <span>{card.roomCode} {card.roomName}</span>
              </td>
              <td>{getAnalyticsCardStatusLabel(card)}</td>
              <td>{card.returnCount}</td>
              <td>{card.holdCount}</td>
              <td>{formatDuration(card.fullCycleSeconds)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TeamAnalyticsPanel({ team }: { team: TeamAnalyticsItem }) {
  return (
    <CollapsibleSection
      kicker={`Команда #${team.rank}`}
      title={team.teamName}
      className="facilitator-postgame-team-panel"
      defaultExpanded={team.rank === 1}
      badge={<span className="status-pill subtle-status-pill">Баланс: {formatMoney(team.currentBalance)}</span>}
    >
      <div className="room-grid facilitator-postgame-summary-grid">
        <article className="info-card">
          <span>Закрыто карточек</span>
          <strong>{team.resolvedProblemCount} / {team.totalProblemCount}</strong>
        </article>
        <article className="info-card">
          <span>Незакрыто</span>
          <strong>{team.unresolvedProblemCount}</strong>
        </article>
        <article className="info-card">
          <span>Возвраты</span>
          <strong>{team.returnCount}</strong>
        </article>
        <article className="info-card">
          <span>Hold-задачи</span>
          <strong>{team.holdCount}</strong>
        </article>
        <article className="info-card">
          <span>Эскалации</span>
          <strong>{team.escalatedProblemCount}</strong>
        </article>
        <article className="info-card">
          <span>Узкое место</span>
          <strong>{team.bottleneckLabel}</strong>
        </article>
      </div>

      <div className="analytics-table-wrap">
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Этап</th>
              <th>Режим</th>
              <th>Карточки</th>
              <th>Закрыто</th>
              <th>Возвраты</th>
              <th>Hold</th>
              <th>Итог этапа</th>
            </tr>
          </thead>
          <tbody>
            {team.stages.map((stage) => (
              <tr key={`${team.teamId}-${stage.stageNumber}`}>
                <td>{stage.stageNumber}</td>
                <td>{getInteractionModeLabel(stage.interactionMode)}</td>
                <td>{stage.totalProblemCount}</td>
                <td>{stage.resolvedProblemCount}</td>
                <td>{stage.returnCount}</td>
                <td>{stage.holdCount}</td>
                <td>{formatMoney(stage.netAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="analytics-table-wrap">
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Участник</th>
              <th>Игровая роль</th>
              <th>Назначено</th>
              <th>В работе</th>
              <th>На согласование</th>
              <th>Закрыто как исполнителем</th>
            </tr>
          </thead>
          <tbody>
            {team.participants.map((participant) => (
              <tr key={participant.participantId}>
                <td>{participant.displayName}</td>
                <td>{participant.gameRole ?? '—'}</td>
                <td>{participant.tasksAssignedCount}</td>
                <td>{participant.tasksStartedCount}</td>
                <td>{participant.tasksSentToReviewCount}</td>
                <td>{participant.tasksClosedAsExecutorCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="waiting-note compact-note">
        <p>
          Ниже показаны самые проблемные карточки команды: сначала незакрытые, затем карточки с возвратами и длинным циклом прохождения.
        </p>
      </div>

      <TeamTopCards team={team} />
    </CollapsibleSection>
  );
}

function FacilitatorPostGameAnalytics({
  sessionCode,
  authHeader,
  analytics,
  loading,
  onRefreshAnalytics,
}: FacilitatorPostGameAnalyticsProps) {
  const [downloading, setDownloading] = useState(false);
  const [exportError, setExportError] = useState('');

  const handleDownload = async (): Promise<void> => {
    setDownloading(true);
    setExportError('');

    try {
      const { blob, filename } = await downloadGameSessionAnalyticsExport(sessionCode, authHeader);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Не удалось подготовить Excel-отчёт.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <CollapsibleSection
      kicker="После игры"
      title="Дашборд ведущего и экспорт результатов"
      className="facilitator-postgame-panel"
      defaultExpanded
      actions={(
        <div className="facilitator-postgame-actions">
          <button
            type="button"
            className="secondary-button compact-button"
            onClick={() => onRefreshAnalytics(sessionCode)}
            disabled={loading}
          >
            {loading ? 'Обновление...' : 'Обновить аналитику'}
          </button>
          <button
            type="button"
            className="primary-button compact-button"
            onClick={() => {
              void handleDownload();
            }}
            disabled={downloading || !analytics}
          >
            {downloading ? 'Подготовка Excel...' : 'Скачать Excel'}
          </button>
        </div>
      )}
    >
      {loading && !analytics ? (
        <div className="waiting-note">
          <p>Собираю послеигровую аналитику по карточкам, этапам и экономике команд.</p>
        </div>
      ) : null}

      {!loading && !analytics ? (
        <div className="waiting-note">
          <p>После завершения игры здесь появится сводка по командам, этапам, карточкам и активности участников.</p>
        </div>
      ) : null}

      {analytics ? (
        <>
          <div className="room-grid facilitator-postgame-summary-grid">
            <article className="info-card">
              <span>Команд</span>
              <strong>{analytics.teamCount}</strong>
            </article>
            <article className="info-card">
              <span>Участников</span>
              <strong>{analytics.participantCount}</strong>
            </article>
            <article className="info-card">
              <span>Закрыто карточек</span>
              <strong>{analytics.resolvedProblemCount} / {analytics.totalProblemCount}</strong>
            </article>
            <article className="info-card">
              <span>Незакрыто</span>
              <strong>{analytics.unresolvedProblemCount}</strong>
            </article>
            <article className="info-card">
              <span>Возвраты</span>
              <strong>{analytics.totalReturnCount}</strong>
            </article>
            <article className="info-card">
              <span>Hold-задачи</span>
              <strong>{analytics.totalHoldCount}</strong>
            </article>
            <article className="info-card">
              <span>Эскалации</span>
              <strong>{analytics.totalEscalatedProblemCount}</strong>
            </article>
            <article className="info-card">
              <span>Игра</span>
              <strong>{formatDateTime(analytics.startedAt)} → {formatDateTime(analytics.finishedAt)}</strong>
            </article>
          </div>

          <div className="analytics-table-wrap">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Этап</th>
                  <th>Режим</th>
                  <th>Карточки</th>
                  <th>Закрыто</th>
                  <th>Возвраты</th>
                  <th>Hold</th>
                  <th>Итог этапа</th>
                </tr>
              </thead>
              <tbody>
                {analytics.stages.map((stage) => (
                  <tr key={stage.stageNumber}>
                    <td>{stage.stageNumber}</td>
                    <td>{getInteractionModeLabel(stage.interactionMode)}</td>
                    <td>{stage.totalProblemCount}</td>
                    <td>{stage.resolvedProblemCount}</td>
                    <td>{stage.returnCount}</td>
                    <td>{stage.holdCount}</td>
                    <td>{formatMoney(stage.netAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="analytics-table-wrap">
            <table className="analytics-table analytics-table--comparison">
              <thead>
                <tr>
                  <th>Место</th>
                  <th>Команда</th>
                  <th>Баланс</th>
                  <th>Закрыто</th>
                  <th>Незакрыто</th>
                  <th>Возвраты</th>
                  <th>Средний цикл</th>
                  <th>Узкое место</th>
                </tr>
              </thead>
              <tbody>
                {analytics.teams.map((team) => (
                  <tr key={team.teamId}>
                    <td>{team.rank}</td>
                    <td>{team.teamName}</td>
                    <td>{formatMoney(team.currentBalance)}</td>
                    <td>{team.resolvedProblemCount}</td>
                    <td>{team.unresolvedProblemCount}</td>
                    <td>{team.returnCount}</td>
                    <td>{formatDuration(team.avgFullCycleSeconds)}</td>
                    <td>{team.bottleneckLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="facilitator-postgame-team-stack">
            {analytics.teams.map((team) => (
              <TeamAnalyticsPanel key={team.teamId} team={team} />
            ))}
          </div>
        </>
      ) : null}

      {exportError ? <p className="form-error">{exportError}</p> : null}
    </CollapsibleSection>
  );
}

export default FacilitatorPostGameAnalytics;
