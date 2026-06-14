import { useEffect, useMemo, useState } from 'react';
import { getHospitalRoomState, hospitalPlanRoomLayouts } from '../constants/hospitalPlan';
import type { TeamProblemEconomyItem, TeamProblemStatus, TeamRoomEconomyItem } from '../types/app';

interface ChiefDoctorHospitalPlanProps {
  rooms: TeamRoomEconomyItem[];
  emptyText?: string;
  orientation?: 'vertical' | 'horizontal';
  detailMode?: 'sidebar' | 'none';
}

const portraitPlanWidth = 300;
const portraitPlanHeight = 720;

const problemStatusLabels: Record<TeamProblemStatus, string> = {
  ACTIVE: 'Активна',
  IN_PROGRESS: 'В работе',
  RESOLVED: 'Решена',
  IGNORED: 'Игнорируется',
};

const problemSeverityLabels: Record<TeamProblemEconomyItem['severity'], string> = {
  MINOR: 'Незначительная',
  SERIOUS: 'Серьёзная',
  CRITICAL: 'Критическая',
};

function rotateLayoutClockwise(layout: (typeof hospitalPlanRoomLayouts)[number]) {
  return {
    ...layout,
    x: layout.y,
    y: portraitPlanWidth - layout.x - layout.width,
    width: layout.height,
    height: layout.width,
    labelVariant: 'horizontal' as const,
  };
}

function ChiefDoctorHospitalPlan({
  rooms,
  emptyText = 'Экономика команды пока не подготовлена. Обновите командный экран или попросите ведущего пересоздать сессию.',
  orientation = 'vertical',
  detailMode = 'sidebar',
}: ChiefDoctorHospitalPlanProps) {
  const [selectedRoomStateId, setSelectedRoomStateId] = useState<number | null>(rooms[0]?.roomStateId ?? null);
  const supportsSelection = detailMode !== 'none';

  const roomsByCode = useMemo(() => new Map(rooms.map((room) => [room.roomCode, room])), [rooms]);
  const planLayouts = useMemo(
    () => (orientation === 'horizontal' ? hospitalPlanRoomLayouts.map(rotateLayoutClockwise) : hospitalPlanRoomLayouts),
    [orientation],
  );
  const frameRect = orientation === 'horizontal'
    ? { x: 8, y: 12, width: 704, height: 276 }
    : { x: 12, y: 8, width: 276, height: 704 };
  const planViewBox = orientation === 'horizontal' ? '0 0 720 300' : '0 0 300 720';

  useEffect(() => {
    if (!supportsSelection || !rooms.length) {
      setSelectedRoomStateId(null);
      return;
    }

    setSelectedRoomStateId((current) => (
      current != null && rooms.some((room) => room.roomStateId === current)
        ? current
        : rooms[0]?.roomStateId ?? null
    ));
  }, [supportsSelection, rooms]);

  const selectedRoom = useMemo(
    () => (supportsSelection
      ? rooms.find((room) => room.roomStateId === selectedRoomStateId) ?? rooms[0] ?? null
      : null),
    [rooms, selectedRoomStateId, supportsSelection],
  );
  const escalatedProblems = selectedRoom?.problems.filter((problem) => problem.escalated) ?? [];

  if (!rooms.length) {
    return (
      <div className="waiting-note compact-note">
        <p>{emptyText}</p>
      </div>
    );
  }

  return (
    <div className={`hospital-plan-layout hospital-plan-layout--${orientation}${detailMode === 'none' ? ' hospital-plan-layout--map-only' : ''}`}>
      <div className={`hospital-plan-shell${orientation === 'horizontal' ? ' hospital-plan-shell--horizontal' : ''}`}>
        <svg
          viewBox={planViewBox}
          className={orientation === 'horizontal' ? 'hospital-plan-svg hospital-plan-svg--horizontal' : 'hospital-plan-svg'}
          role="img"
          aria-label="Упрощённый план поликлиники"
        >
          <rect x={frameRect.x} y={frameRect.y} width={frameRect.width} height={frameRect.height} rx="18" className="plan-frame" />

          {planLayouts.map((layout) => {
            const room = roomsByCode.get(layout.roomCode);
            const state = getHospitalRoomState(room?.activeProblemCount ?? 0, room?.worstProblemSeverity);
            const isSelected = supportsSelection && room?.roomStateId === selectedRoom?.roomStateId;
            const labelLines = layout.labelLines ?? [room?.roomName ?? layout.fallbackName];
            const labelX = layout.x + layout.width / 2;
            const labelY = layout.y + layout.height / 2;
            const problemBadgeX = layout.x + layout.width - 18;
            const problemBadgeY = layout.y + 18;
            const interactive = Boolean(room) && supportsSelection;

            return (
              <g
                key={layout.id}
                className={`plan-room-group plan-room-group--${state}${interactive ? ' plan-room-group--interactive' : ''}${isSelected ? ' is-selected' : ''}`}
                onClick={() => {
                  if (room && interactive) {
                    setSelectedRoomStateId(room.roomStateId);
                  }
                }}
                onKeyDown={(event) => {
                  if (room && interactive && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    setSelectedRoomStateId(room.roomStateId);
                  }
                }}
                role={interactive ? 'button' : undefined}
                tabIndex={interactive ? 0 : -1}
                aria-label={`${room?.roomName ?? layout.fallbackName}, активных проблем: ${room?.activeProblemCount ?? 0}`}
              >
                <rect
                  x={layout.x}
                  y={layout.y}
                  width={layout.width}
                  height={layout.height}
                  rx="14"
                  className="plan-room"
                />

                {orientation === 'vertical' && layout.labelVariant === 'vertical' ? (
                  <text x={labelX} y={labelY} textAnchor="middle" className="plan-room-label plan-room-label--vertical">
                    {labelLines.map((line, index) => (
                      <tspan key={`${layout.id}-${line}`} x={labelX} dy={index === 0 ? 0 : 18}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                ) : (
                  <text x={labelX} y={labelY - ((labelLines.length - 1) * 8)} textAnchor="middle" className="plan-room-label">
                    {labelLines.map((line, index) => (
                      <tspan key={`${layout.id}-${line}`} x={labelX} dy={index === 0 ? 0 : 16}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                )}

                {room ? (
                  <g className="plan-problem-badge" aria-hidden="true">
                    <circle cx={problemBadgeX} cy={problemBadgeY} r="13" />
                    <text x={problemBadgeX} y={problemBadgeY + 4} textAnchor="middle">
                      {room.activeProblemCount}
                    </text>
                  </g>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

      {detailMode === 'sidebar' && selectedRoom ? (
        <div className="hospital-plan-sidebar">
          <article className={`hospital-room-summary hospital-room-summary--${getHospitalRoomState(selectedRoom.activeProblemCount, selectedRoom.worstProblemSeverity)}`}>
            <p className="section-kicker">Выбранный кабинет</p>
            <h3>{selectedRoom.roomName}</h3>
            <dl className="hospital-room-metrics">
              <div>
                <dt>Активных проблем</dt>
                <dd>{selectedRoom.activeProblemCount}</dd>
              </div>
              <div>
                <dt>Кризисов 3 этапа</dt>
                <dd>{escalatedProblems.length}</dd>
              </div>
              <div>
                <dt>Базовый доход кабинета</dt>
                <dd>{Number(selectedRoom.baseIncome).toFixed(2)}</dd>
              </div>
              <div>
                <dt>Коэффициент состояния</dt>
                <dd>{Number(selectedRoom.stateCoefficient).toFixed(2)}</dd>
              </div>
              <div>
                <dt>Статус кабинета</dt>
                <dd>
                  {getHospitalRoomState(selectedRoom.activeProblemCount, selectedRoom.worstProblemSeverity) === 'critical'
                    ? 'Критическая нагрузка'
                    : getHospitalRoomState(selectedRoom.activeProblemCount, selectedRoom.worstProblemSeverity) === 'warning'
                      ? 'Нужен контроль'
                      : 'Стабильная зона'}
                </dd>
              </div>
            </dl>
            {escalatedProblems.length ? (
              <div className="hospital-room-alert">
                <strong>Есть задачи с эскалацией 3 этапа.</strong>
                <span>Их лучше закрыть в первую очередь: они могут дать дополнительный штраф по этапу.</span>
              </div>
            ) : null}
            <div className="hospital-room-problems">
              <p className="section-kicker">Проблемы кабинета</p>
              <div className="hospital-problem-list">
                {selectedRoom.problems.map((problem) => (
                  <article key={problem.problemStateId} className={`hospital-problem-card hospital-problem-card--${problem.status.toLowerCase()}`}>
                    <div className="hospital-problem-card-header">
                      <strong>{problem.title}</strong>
                      {problem.escalated && problem.escalationTitle ? (
                        <span className="hospital-problem-crisis-badge">{problem.escalationTitle}</span>
                      ) : null}
                    </div>
                    <div>
                      <span>
                        Этап {problem.stageNumber} · {problemSeverityLabels[problem.severity]} проблема ·
                        {' '}стоимость {Number(problem.budgetCost).toFixed(2)} / {problem.timeCost} вр. ·
                        {' '}штраф {Number(problem.ignorePenalty).toFixed(2)} · статус {problemStatusLabels[problem.status]}
                      </span>
                      {problem.escalated && problem.escalationPenaltyHint ? (
                        <span className="hospital-problem-escalation">
                          {problem.escalationPenaltyHint}
                        </span>
                      ) : null}
                      {problem.requiredItemName && problem.requiredItemQuantity > 0 ? (
                        <span>
                          Нужно: {problem.requiredItemName}, {problem.requiredItemQuantity} шт.
                        </span>
                      ) : null}
                    </div>

                  </article>
                ))}
              </div>
            </div>
            <p className="participant-role-subtitle hospital-room-summary-note">
              Схема показывает живое состояние команды: статусы проблем обновляются через карточки на канбан-доске.
            </p>
          </article>
        </div>
      ) : null}
    </div>
  );
}

export default ChiefDoctorHospitalPlan;
