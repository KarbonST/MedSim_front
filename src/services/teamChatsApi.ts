import type {
  FacilitatorTeamChatsResponse,
  PlayerTeamChatResponse,
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

function createAuthorizedHeaders(authHeader: string, init?: HeadersInit): HeadersInit {
  return {
    ...init,
    Authorization: authHeader,
  };
}

function buildWebSocketUrl(params: Record<string, string>): string {
  const url = new URL('/ws/team-chat', window.location.origin);
  url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url.toString();
}

export async function fetchPlayerTeamChat(
  sessionCode: string,
  participantId: number,
): Promise<PlayerTeamChatResponse> {
  const response = await fetch(
    `${API_PREFIX}/player-sessions/${encodeURIComponent(sessionCode)}/participants/${participantId}/chat`,
  );

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(
        response,
        response.status === 409
          ? 'Чат команды станет доступен после старта игры и распределения по командам.'
          : 'Не удалось загрузить сообщения команды. Попробуйте ещё раз.',
      ),
    );
  }

  return response.json() as Promise<PlayerTeamChatResponse>;
}

export async function fetchFacilitatorTeamChats(
  sessionCode: string,
  authHeader: string,
): Promise<FacilitatorTeamChatsResponse> {
  const response = await fetch(
    `${API_PREFIX}/game-sessions/${encodeURIComponent(sessionCode)}/team-chats`,
    {
      headers: createAuthorizedHeaders(authHeader),
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(
        response,
        response.status === 401
          ? 'Нужно заново войти под учётной записью ведущего.'
          : 'Не удалось загрузить командные чаты. Попробуйте ещё раз.',
      ),
    );
  }

  return response.json() as Promise<FacilitatorTeamChatsResponse>;
}

export function createPlayerTeamChatSocket(sessionCode: string, participantId: number): WebSocket {
  return new WebSocket(buildWebSocketUrl({ sessionCode, participantId: String(participantId) }));
}

export function createFacilitatorTeamChatSocket(sessionCode: string, authHeader: string): WebSocket {
  const credentials = authHeader.replace(/^Basic\s+/i, '');
  return new WebSocket(buildWebSocketUrl({ sessionCode, credentials }));
}
