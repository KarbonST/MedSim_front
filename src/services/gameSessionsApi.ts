import type {
  GameSessionCreateRequest,
  GameSessionParticipantsResponse,
  GameSessionRenameRequest,
  GameSessionRoleAssignmentRequest,
  GameSessionStageSettingsRequest,
  GameSessionSummary,
  GameSessionTeamAssignmentRequest,
  GameSessionTeamRenameRequest,
  SessionParticipantSummary,
} from '../types/app';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const API_PREFIX = `${API_BASE_URL}/api`;

function createAuthorizedHeaders(authHeader: string, init?: HeadersInit): HeadersInit {
  return {
    ...init,
    Authorization: authHeader,
  };
}

async function parseApiError(response: Response, fallbackMessage: string): Promise<string> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const payload = await response.json().catch(() => null) as
      | { detail?: string; message?: string; error?: string; title?: string }
      | null;

    const message = payload?.detail ?? payload?.message ?? payload?.error ?? payload?.title;

    if (message) {
      return message;
    }
  }

  const text = await response.text().catch(() => '');
  return text.trim() || fallbackMessage;
}

export async function fetchGameSessions(authHeader: string): Promise<GameSessionSummary[]> {
  const response = await fetch(`${API_PREFIX}/game-sessions`, {
    headers: createAuthorizedHeaders(authHeader),
  });

  if (!response.ok) {
    throw new Error(
      await parseApiError(
        response,
        response.status === 401
          ? 'Нужно заново войти под учётной записью ведущего.'
          : 'Не удалось загрузить список сессий. Попробуйте ещё раз.',
      ),
    );
  }

  return response.json() as Promise<GameSessionSummary[]>;
}

export async function createGameSession(
  request: GameSessionCreateRequest,
  authHeader: string,
): Promise<GameSessionSummary> {
  const response = await fetch(`${API_PREFIX}/game-sessions`, {
    method: 'POST',
    headers: createAuthorizedHeaders(authHeader, {
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(
      await parseApiError(
        response,
        response.status === 401
          ? 'Нужно заново войти под учётной записью ведущего.'
          : 'Не удалось создать сессию. Проверьте название и количество команд.',
      ),
    );
  }

  return response.json() as Promise<GameSessionSummary>;
}

export async function renameGameSession(
  sessionCode: string,
  request: GameSessionRenameRequest,
  authHeader: string,
): Promise<GameSessionSummary> {
  const response = await fetch(
    `${API_PREFIX}/game-sessions/${encodeURIComponent(sessionCode)}/name`,
    {
      method: 'PATCH',
      headers: createAuthorizedHeaders(authHeader, {
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(request),
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseApiError(
        response,
        response.status === 401
          ? 'Нужно заново войти под учётной записью ведущего.'
          : 'Не удалось переименовать сессию. Попробуйте ещё раз.',
      ),
    );
  }

  return response.json() as Promise<GameSessionSummary>;
}

export async function renameGameSessionTeam(
  sessionCode: string,
  teamId: number,
  request: GameSessionTeamRenameRequest,
  authHeader: string,
): Promise<GameSessionParticipantsResponse> {
  const response = await fetch(
    `${API_PREFIX}/game-sessions/${encodeURIComponent(sessionCode)}/teams/${teamId}/name`,
    {
      method: 'PATCH',
      headers: createAuthorizedHeaders(authHeader, {
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(request),
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseApiError(
        response,
        response.status === 401
          ? 'Нужно заново войти под учётной записью ведущего.'
          : 'Не удалось переименовать команду. Попробуйте ещё раз.',
      ),
    );
  }

  return response.json() as Promise<GameSessionParticipantsResponse>;
}

export async function fetchGameSessionParticipants(
  sessionCode: string,
  authHeader: string,
): Promise<GameSessionParticipantsResponse> {
  const response = await fetch(
    `${API_PREFIX}/game-sessions/${encodeURIComponent(sessionCode)}/participants`,
    {
      headers: createAuthorizedHeaders(authHeader),
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseApiError(
        response,
        response.status === 404
          ? 'Сессия с таким кодом пока не найдена.'
          : response.status === 401
            ? 'Нужно заново войти под учётной записью ведущего.'
            : 'Не удалось загрузить список участников. Попробуйте ещё раз.',
      ),
    );
  }

  return response.json() as Promise<GameSessionParticipantsResponse>;
}

export async function autoAssignTeams(
  sessionCode: string,
  authHeader: string,
): Promise<GameSessionParticipantsResponse> {
  const response = await fetch(
    `${API_PREFIX}/game-sessions/${encodeURIComponent(sessionCode)}/teams/auto-assign`,
    {
      method: 'POST',
      headers: createAuthorizedHeaders(authHeader),
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseApiError(
        response,
        response.status === 401
          ? 'Нужно заново войти под учётной записью ведущего.'
          : 'Не удалось автоматически распределить игроков по командам. Попробуйте ещё раз.',
      ),
    );
  }

  return response.json() as Promise<GameSessionParticipantsResponse>;
}

export async function assignParticipantTeam(
  sessionCode: string,
  participantId: number,
  request: GameSessionTeamAssignmentRequest,
  authHeader: string,
): Promise<GameSessionParticipantsResponse> {
  const response = await fetch(
    `${API_PREFIX}/game-sessions/${encodeURIComponent(sessionCode)}/participants/${participantId}/team`,
    {
      method: 'PATCH',
      headers: createAuthorizedHeaders(authHeader, {
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(request),
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseApiError(
        response,
        response.status === 401
          ? 'Нужно заново войти под учётной записью ведущего.'
          : 'Не удалось назначить команду участнику. Попробуйте ещё раз.',
      ),
    );
  }

  return response.json() as Promise<GameSessionParticipantsResponse>;
}

export async function saveGameSessionStages(
  sessionCode: string,
  request: GameSessionStageSettingsRequest,
  authHeader: string,
): Promise<GameSessionParticipantsResponse> {
  const response = await fetch(
    `${API_PREFIX}/game-sessions/${encodeURIComponent(sessionCode)}/stages`,
    {
      method: 'PUT',
      headers: createAuthorizedHeaders(authHeader, {
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(request),
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseApiError(
        response,
        response.status === 401
          ? 'Нужно заново войти под учётной записью ведущего.'
          : 'Не удалось сохранить настройки этапов. Попробуйте ещё раз.',
      ),
    );
  }

  return response.json() as Promise<GameSessionParticipantsResponse>;
}

export async function assignRandomGameRoles(
  sessionCode: string,
  authHeader: string,
): Promise<GameSessionParticipantsResponse> {
  const response = await fetch(
    `${API_PREFIX}/game-sessions/${encodeURIComponent(sessionCode)}/roles/random`,
    {
      method: 'POST',
      headers: createAuthorizedHeaders(authHeader),
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseApiError(
        response,
        response.status === 401
          ? 'Нужно заново войти под учётной записью ведущего.'
          : 'Не удалось автоматически назначить роли. Попробуйте ещё раз.',
      ),
    );
  }

  return response.json() as Promise<GameSessionParticipantsResponse>;
}

export async function assignManualGameRole(
  sessionCode: string,
  participantId: number,
  request: GameSessionRoleAssignmentRequest,
  authHeader: string,
): Promise<SessionParticipantSummary> {
  const response = await fetch(
    `${API_PREFIX}/game-sessions/${encodeURIComponent(sessionCode)}/participants/${participantId}/role`,
    {
      method: 'PATCH',
      headers: createAuthorizedHeaders(authHeader, {
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(request),
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseApiError(
        response,
        response.status === 401
          ? 'Нужно заново войти под учётной записью ведущего.'
          : 'Не удалось назначить игровую роль. Попробуйте ещё раз.',
      ),
    );
  }

  return response.json() as Promise<SessionParticipantSummary>;
}

export async function startGameSession(
  sessionCode: string,
  authHeader: string,
): Promise<GameSessionSummary> {
  const response = await fetch(
    `${API_PREFIX}/game-sessions/${encodeURIComponent(sessionCode)}/start`,
    {
      method: 'PATCH',
      headers: createAuthorizedHeaders(authHeader),
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseApiError(
        response,
        response.status === 401
          ? 'Нужно заново войти под учётной записью ведущего.'
          : 'Не удалось запустить сессию. Попробуйте ещё раз.',
      ),
    );
  }

  return response.json() as Promise<GameSessionSummary>;
}

export async function finishGameSession(
  sessionCode: string,
  authHeader: string,
): Promise<GameSessionSummary> {
  const response = await fetch(
    `${API_PREFIX}/game-sessions/${encodeURIComponent(sessionCode)}/finish`,
    {
      method: 'PATCH',
      headers: createAuthorizedHeaders(authHeader),
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseApiError(
        response,
        response.status === 401
          ? 'Нужно заново войти под учётной записью ведущего.'
          : 'Не удалось завершить сессию. Попробуйте ещё раз.',
      ),
    );
  }

  return response.json() as Promise<GameSessionSummary>;
}

export async function deleteGameSession(
  sessionCode: string,
  authHeader: string,
): Promise<void> {
  const response = await fetch(
    `${API_PREFIX}/game-sessions/${encodeURIComponent(sessionCode)}`,
    {
      method: 'DELETE',
      headers: createAuthorizedHeaders(authHeader),
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseApiError(
        response,
        response.status === 401
          ? 'Нужно заново войти под учётной записью ведущего.'
          : 'Не удалось удалить сессию. Попробуйте ещё раз.',
      ),
    );
  }
}
