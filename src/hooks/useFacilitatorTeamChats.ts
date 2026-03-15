import { startTransition, useEffect, useEffectEvent, useRef, useState } from 'react';
import {
  createFacilitatorTeamChatSocket,
  fetchFacilitatorTeamChats,
} from '../services/teamChatsApi';
import type {
  ChatConnectionStatus,
  FacilitatorTeamChatThread,
  TeamChatMessage,
} from '../types/app';

interface UseFacilitatorTeamChatsArgs {
  sessionCode: string;
  authHeader: string;
  enabled: boolean;
}

interface FacilitatorTeamChatsState {
  loading: boolean;
  error: string;
  connectionStatus: ChatConnectionStatus;
  teamChats: FacilitatorTeamChatThread[];
}

const initialState: FacilitatorTeamChatsState = {
  loading: false,
  error: '',
  connectionStatus: 'idle',
  teamChats: [],
};

function appendMessageToThreads(
  current: FacilitatorTeamChatThread[],
  incoming: TeamChatMessage,
): FacilitatorTeamChatThread[] {
  const threadExists = current.some((thread) => thread.teamId === incoming.teamId);

  const nextThreads = threadExists
    ? current.map((thread) => {
      if (thread.teamId !== incoming.teamId) {
        return thread;
      }

      if (thread.messages.some((message) => message.id === incoming.id)) {
        return thread;
      }

      return {
        ...thread,
        messages: [...thread.messages, incoming],
      };
    })
    : [...current, {
      teamId: incoming.teamId,
      teamName: incoming.teamName,
      sortOrder: current.length + 1,
      messages: [incoming],
    }];

  return [...nextThreads].sort((left, right) => left.sortOrder - right.sortOrder);
}

export function useFacilitatorTeamChats({
  sessionCode,
  authHeader,
  enabled,
}: UseFacilitatorTeamChatsArgs) {
  const [chatState, setChatState] = useState<FacilitatorTeamChatsState>(initialState);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);

  const appendMessage = useEffectEvent((message: TeamChatMessage) => {
    startTransition(() => {
      setChatState((current) => ({
        ...current,
        teamChats: appendMessageToThreads(current.teamChats, message),
      }));
    });
  });

  const setConnectionStatus = useEffectEvent((connectionStatus: ChatConnectionStatus) => {
    setChatState((current) => ({ ...current, connectionStatus }));
  });

  const setChatError = useEffectEvent((error: string) => {
    setChatState((current) => ({ ...current, error }));
  });

  useEffect(() => {
    if (!enabled || !authHeader) {
      setChatState(initialState);
      return undefined;
    }

    let disposed = false;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current != null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const closeSocket = () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };

    const connect = (isReconnect: boolean) => {
      if (disposed) {
        return;
      }

      clearReconnectTimer();
      setConnectionStatus(isReconnect ? 'reconnecting' : 'connecting');

      const socket = createFacilitatorTeamChatSocket(sessionCode, authHeader);
      socketRef.current = socket;

      socket.onopen = () => {
        if (disposed) {
          socket.close();
          return;
        }
        setConnectionStatus('open');
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as {
            type?: string;
            message?: TeamChatMessage;
            errorMessage?: string;
          };

          if (payload.type === 'TEAM_CHAT_MESSAGE' && payload.message) {
            appendMessage(payload.message);
          }

          if (payload.type === 'TEAM_CHAT_ERROR' && payload.errorMessage) {
            setChatError(payload.errorMessage);
          }
        } catch {
          setChatError('Не удалось обработать входящее сообщение чата.');
        }
      };

      socket.onclose = () => {
        if (disposed) {
          return;
        }

        setConnectionStatus('closed');
        reconnectTimerRef.current = window.setTimeout(() => {
          connect(true);
        }, 1500);
      };

      socket.onerror = () => {
        setChatError('Подключение к чатам команд временно недоступно. Выполняется переподключение.');
      };
    };

    const loadTeamChats = async () => {
      setChatState((current) => ({ ...current, loading: true, error: '' }));

      try {
        const payload = await fetchFacilitatorTeamChats(sessionCode, authHeader);

        if (disposed) {
          return;
        }

        startTransition(() => {
          setChatState({
            loading: false,
            error: '',
            connectionStatus: 'idle',
            teamChats: payload.teamChats,
          });
        });

        connect(false);
      } catch (error) {
        if (disposed) {
          return;
        }

        setChatState({
          loading: false,
          error: error instanceof Error ? error.message : 'Не удалось загрузить чаты команд.',
          connectionStatus: 'closed',
          teamChats: [],
        });
      }
    };

    void loadTeamChats();

    return () => {
      disposed = true;
      clearReconnectTimer();
      closeSocket();
    };
  }, [enabled, sessionCode, authHeader]);

  return {
    chatState,
  };
}
