import type { PlayerSession, PlayerSessionJoinRequest } from '../types/app';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export async function joinPlayerSession(
  payload: PlayerSessionJoinRequest,
): Promise<PlayerSession> {
  const response = await fetch(`${API_BASE_URL}/api/player-sessions/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const fallbackMessage = response.status === 400
      ? 'Проверьте имя, должность и код сессии.'
      : 'Не удалось подключиться к сессии. Попробуйте ещё раз.';

    throw new Error(fallbackMessage);
  }

  return response.json() as Promise<PlayerSession>;
}
