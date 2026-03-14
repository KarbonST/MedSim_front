import type {
  GameSessionParticipantsResponse,
  GameSessionSummary,
} from '../types/app';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export async function fetchGameSessions(): Promise<GameSessionSummary[]> {
  const response = await fetch(`${API_BASE_URL}/api/game-sessions`);

  if (!response.ok) {
    throw new Error('Не удалось загрузить список сессий. Попробуйте ещё раз.');
  }

  return response.json() as Promise<GameSessionSummary[]>;
}

export async function fetchGameSessionParticipants(
  sessionCode: string,
): Promise<GameSessionParticipantsResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/game-sessions/${encodeURIComponent(sessionCode)}/participants`,
  );

  if (!response.ok) {
    const fallbackMessage = response.status === 404
      ? 'Сессия с таким кодом пока не найдена.'
      : 'Не удалось загрузить список участников. Попробуйте ещё раз.';

    throw new Error(fallbackMessage);
  }

  return response.json() as Promise<GameSessionParticipantsResponse>;
}

export async function startGameSession(sessionCode: string): Promise<GameSessionSummary> {
  const response = await fetch(
    `${API_BASE_URL}/api/game-sessions/${encodeURIComponent(sessionCode)}/start`,
    {
      method: 'PATCH',
    },
  );

  if (!response.ok) {
    throw new Error('Не удалось запустить сессию. Попробуйте ещё раз.');
  }

  return response.json() as Promise<GameSessionSummary>;
}

export async function finishGameSession(sessionCode: string): Promise<GameSessionSummary> {
  const response = await fetch(
    `${API_BASE_URL}/api/game-sessions/${encodeURIComponent(sessionCode)}/finish`,
    {
      method: 'PATCH',
    },
  );

  if (!response.ok) {
    throw new Error('Не удалось завершить сессию. Попробуйте ещё раз.');
  }

  return response.json() as Promise<GameSessionSummary>;
}

export async function deleteGameSession(sessionCode: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/game-sessions/${encodeURIComponent(sessionCode)}`,
    {
      method: 'DELETE',
    },
  );

  if (!response.ok) {
    throw new Error('Не удалось удалить сессию. Попробуйте ещё раз.');
  }
}
