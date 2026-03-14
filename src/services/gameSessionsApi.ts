import type {
  GameSessionParticipantsResponse,
  GameSessionSummary,
} from '../types/app';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

function createAuthorizedHeaders(authHeader: string): HeadersInit {
  return {
    Authorization: authHeader,
  };
}

export async function fetchGameSessions(authHeader: string): Promise<GameSessionSummary[]> {
  const response = await fetch(`${API_BASE_URL}/api/game-sessions`, {
    headers: createAuthorizedHeaders(authHeader),
  });

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? 'Нужно заново войти под учётной записью ведущего.'
        : 'Не удалось загрузить список сессий. Попробуйте ещё раз.',
    );
  }

  return response.json() as Promise<GameSessionSummary[]>;
}

export async function fetchGameSessionParticipants(
  sessionCode: string,
  authHeader: string,
): Promise<GameSessionParticipantsResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/game-sessions/${encodeURIComponent(sessionCode)}/participants`,
    {
      headers: createAuthorizedHeaders(authHeader),
    },
  );

  if (!response.ok) {
    const fallbackMessage = response.status === 404
      ? 'Сессия с таким кодом пока не найдена.'
      : response.status === 401
        ? 'Нужно заново войти под учётной записью ведущего.'
        : 'Не удалось загрузить список участников. Попробуйте ещё раз.';

    throw new Error(fallbackMessage);
  }

  return response.json() as Promise<GameSessionParticipantsResponse>;
}

export async function startGameSession(
  sessionCode: string,
  authHeader: string,
): Promise<GameSessionSummary> {
  const response = await fetch(
    `${API_BASE_URL}/api/game-sessions/${encodeURIComponent(sessionCode)}/start`,
    {
      method: 'PATCH',
      headers: createAuthorizedHeaders(authHeader),
    },
  );

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? 'Нужно заново войти под учётной записью ведущего.'
        : 'Не удалось запустить сессию. Попробуйте ещё раз.',
    );
  }

  return response.json() as Promise<GameSessionSummary>;
}

export async function finishGameSession(
  sessionCode: string,
  authHeader: string,
): Promise<GameSessionSummary> {
  const response = await fetch(
    `${API_BASE_URL}/api/game-sessions/${encodeURIComponent(sessionCode)}/finish`,
    {
      method: 'PATCH',
      headers: createAuthorizedHeaders(authHeader),
    },
  );

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? 'Нужно заново войти под учётной записью ведущего.'
        : 'Не удалось завершить сессию. Попробуйте ещё раз.',
    );
  }

  return response.json() as Promise<GameSessionSummary>;
}

export async function deleteGameSession(
  sessionCode: string,
  authHeader: string,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/game-sessions/${encodeURIComponent(sessionCode)}`,
    {
      method: 'DELETE',
      headers: createAuthorizedHeaders(authHeader),
    },
  );

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? 'Нужно заново войти под учётной записью ведущего.'
        : 'Не удалось удалить сессию. Попробуйте ещё раз.',
    );
  }
}
