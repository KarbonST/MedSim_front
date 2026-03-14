import type {
  AvailablePlayerSession,
  PlayerSession,
  PlayerSessionJoinRequest,
  PlayerTeamWorkspace,
} from '../types/app';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const API_PREFIX = `${API_BASE_URL}/api`;

async function parseErrorMessage(response: Response, fallbackMessage: string): Promise<string> {
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

export async function fetchAvailablePlayerSessions(): Promise<AvailablePlayerSession[]> {
  const response = await fetch(`${API_PREFIX}/player-sessions/available`);

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(
        response,
        'Не удалось загрузить список доступных сессий. Попробуйте ещё раз.',
      ),
    );
  }

  return response.json() as Promise<AvailablePlayerSession[]>;
}

export async function joinPlayerSession(
  payload: PlayerSessionJoinRequest,
): Promise<PlayerSession> {
  const response = await fetch(`${API_PREFIX}/player-sessions/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const fallbackMessage = response.status === 400
      ? 'Проверьте имя, должность и выбранную сессию.'
      : response.status === 404
        ? 'Сессия больше недоступна. Выберите существующую сессию из списка.'
        : response.status === 409
          ? 'К этой сессии сейчас нельзя подключиться. Выберите другую.'
          : 'Не удалось подключиться к сессии. Попробуйте ещё раз.';

    throw new Error(await parseErrorMessage(response, fallbackMessage));
  }

  return response.json() as Promise<PlayerSession>;
}

export async function fetchPlayerTeamWorkspace(
  sessionCode: string,
  participantId: number,
): Promise<PlayerTeamWorkspace> {
  const response = await fetch(
    `${API_PREFIX}/player-sessions/${encodeURIComponent(sessionCode)}/participants/${participantId}/workspace`,
  );

  if (!response.ok) {
    const fallbackMessage = response.status === 404
      ? 'Сессия или участник больше не найдены. Подключитесь заново.'
      : 'Не удалось загрузить командный экран. Попробуйте ещё раз.';

    throw new Error(await parseErrorMessage(response, fallbackMessage));
  }

  return response.json() as Promise<PlayerTeamWorkspace>;
}
