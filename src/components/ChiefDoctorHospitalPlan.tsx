import { useMemo, useState } from 'react';
import { getHospitalRoomState, hospitalPlanRooms } from '../constants/hospitalPlan';

function ChiefDoctorHospitalPlan() {
  const initialRoom = hospitalPlanRooms[0] ?? null;
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(initialRoom?.id ?? null);

  const selectedRoom = useMemo(
    () => hospitalPlanRooms.find((room) => room.id === selectedRoomId) ?? hospitalPlanRooms[0],
    [selectedRoomId],
  );

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

          {hospitalPlanRooms.map((room) => {
            const state = getHospitalRoomState(room.problemCount);
            const isSelected = room.id === selectedRoom?.id;
            const labelLines = room.labelLines ?? [room.name];
            const labelX = room.x + room.width / 2;
            const labelY = room.y + room.height / 2;

            return (
              <g
                key={room.id}
                className={`plan-room-group plan-room-group--${state}${isSelected ? ' is-selected' : ''}`}
                onClick={() => setSelectedRoomId(room.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedRoomId(room.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`${room.name}, проблем: ${room.problemCount}`}
              >
                <rect
                  x={room.x}
                  y={room.y}
                  width={room.width}
                  height={room.height}
                  rx="14"
                  className="plan-room"
                />

                {room.labelVariant === 'vertical' ? (
                  <text x={labelX} y={labelY} textAnchor="middle" className="plan-room-label plan-room-label--vertical">
                    {labelLines.map((line, index) => (
                      <tspan key={`${room.id}-${line}`} x={labelX} dy={index === 0 ? 0 : 18}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                ) : (
                  <text x={labelX} y={labelY - ((labelLines.length - 1) * 8)} textAnchor="middle" className="plan-room-label">
                    {labelLines.map((line, index) => (
                      <tspan key={`${room.id}-${line}`} x={labelX} dy={index === 0 ? 0 : 16}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {selectedRoom ? (
        <div className="hospital-plan-sidebar">
          <article className={`hospital-room-summary hospital-room-summary--${getHospitalRoomState(selectedRoom.problemCount)}`}>
            <p className="section-kicker">Выбранный кабинет</p>
            <h3>{selectedRoom.name}</h3>
            <dl className="hospital-room-metrics">
              <div>
                <dt>Проблем сейчас</dt>
                <dd>{selectedRoom.problemCount}</dd>
              </div>
              <div>
                <dt>Базовый доход кабинета</dt>
                <dd>{selectedRoom.income}</dd>
              </div>
              <div>
                <dt>Статус кабинета</dt>
                <dd>
                  {getHospitalRoomState(selectedRoom.problemCount) === 'critical'
                    ? 'Критическая нагрузка'
                    : getHospitalRoomState(selectedRoom.problemCount) === 'warning'
                      ? 'Нужен контроль'
                      : 'Стабильная зона'}
                </dd>
              </div>
            </dl>
            <div className="hospital-room-problems">
              <p className="section-kicker">Проблемы кабинета</p>
              <ul>
                {selectedRoom.problems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            </div>
            <p className="participant-role-subtitle hospital-room-summary-note">
              Схема показывает кабинеты поликлиники, а список справа помогает быстро понять, где именно сейчас нужна
              управленческая реакция.
            </p>
          </article>
        </div>
      ) : null}
    </div>
  );
}

export default ChiefDoctorHospitalPlan;
