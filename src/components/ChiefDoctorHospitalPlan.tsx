import { useMemo, useState } from 'react';
import { getHospitalRoomState, hospitalPlanRoomLayouts } from '../constants/hospitalPlan';
import type { TeamProblemEconomyItem, TeamProblemStatus, TeamRoomEconomyItem } from '../types/app';

interface ChiefDoctorHospitalPlanProps {
  rooms: TeamRoomEconomyItem[];
  emptyText?: string;
}

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

function ChiefDoctorHospitalPlan({ rooms, emptyText = 'Экономика команды пока не подготовлена. Обновите командный экран или попросите ведущего пересоздать сессию.' }: ChiefDoctorHospitalPlanProps) {
  const [selectedRoomStateId, setSelectedRoomStateId] = useState<number | null>(rooms[0]?.roomStateId ?? null);

  const roomsByCode = useMemo(() => new Map(rooms.map((room) => [room.roomCode, room])), [rooms]);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.roomStateId === selectedRoomStateId) ?? rooms[0] ?? null,
    [rooms, selectedRoomStateId],
  );

  if (!rooms.length) {
    return (
      <div className="waiting-note compact-note">
        <p>{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="hospital-plan-layout">
      <div className="hospital-plan-shell">
        <svg
          viewBox="0 0 300 720"
          className="hospital-plan-svg"
          role="img"
          aria-label="Упрощённый план поликлиники"
        >
          <rect x="12" y="8" width="276" height="704" rx="18" className="plan-frame" />

          {hospitalPlanRoomLayouts.map((layout) => {
            const room = roomsByCode.get(layout.roomCode);
            const state = getHospitalRoomState(room?.activeProblemCount ?? 0, room?.worstProblemSeverity);
            const isSelected = room?.roomStateId === selectedRoom?.roomStateId;
            const labelLines = layout.labelLines ?? [room?.roomName ?? layout.fallbackName];
            const labelX = layout.x + layout.width / 2;
            const labelY = layout.y + layout.height / 2;
            const problemBadgeX = layout.x + layout.width - 18;
            const problemBadgeY = layout.y + 18;

            return (
              <g
                key={layout.id}
                className={`plan-room-group plan-room-group--${state}${isSelected ? ' is-selected' : ''}`}
                onClick={() => {
                  if (room) {
                    setSelectedRoomStateId(room.roomStateId);
                  }
                }}
                onKeyDown={(event) => {
                  if (room && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    setSelectedRoomStateId(room.roomStateId);
                  }
                }}
                role="button"
                tabIndex={room ? 0 : -1}
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

                {layout.labelVariant === 'vertical' ? (
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

      {selectedRoom ? (
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
            <div className="hospital-room-problems">
              <p className="section-kicker">Проблемы кабинета</p>
              <div className="hospital-problem-list">
                {selectedRoom.problems.map((problem) => (
                  <article key={problem.problemStateId} className={`hospital-problem-card hospital-problem-card--${problem.status.toLowerCase()}`}>
                    <div>
                      <strong>#{problem.problemNumber} {problem.title}</strong>
                      <span>
                        Этап {problem.stageNumber} · {problemSeverityLabels[problem.severity]} проблема ·
                        {' '}стоимость {Number(problem.budgetCost).toFixed(2)} / {problem.timeCost} вр. ·
                        {' '}штраф {Number(problem.ignorePenalty).toFixed(2)} · статус {problemStatusLabels[problem.status]}
                      </span>
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
