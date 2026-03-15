const SESSION_STATUS_LABELS: Record<string, string> = {
  LOBBY: 'Подготовка',
  IN_PROGRESS: 'Идёт игра',
  PAUSED: 'На паузе',
  FINISHED: 'Завершена',
};

export function getSessionStatusLabel(status: string): string {
  return SESSION_STATUS_LABELS[status] ?? status;
}
