import { startTransition, useEffect, useEffectEvent, useRef, useState } from 'react';
import {
  createPlayerTeamChatSocket,
  fetchPlayerTeamChat,
} from '../services/teamChatsApi';
import type { ChatConnectionStatus, TeamChatMessage } from '../types/app';

interface UsePlayerTeamChatArgs {
  sessionCode: string;
  participantId: number;
  enabled: boolean;
}

interface PlayerTeamChatState {
  loading: boolean;
  error: string;
  connectionStatus: ChatConnectionStatus;
  messages: TeamChatMessage[];
}

const initialState: PlayerTeamChatState = {
  loading: false,
  error: '',
  connectionStatus: 'idle',
  messages: [],
};

function mergeMessages(current: TeamChatMessage[], incoming: TeamChatMessage): TeamChatMessage[] {
  if (current.some((message) => message.id === incoming.id)) {
    return current;
  }
  return [...current, incoming];
}

export function usePlayerTeamChat({ sessionCode, participantId, enabled }: UsePlayerTeamChatArgs) {
  const [chatState, setChatState] = useState<PlayerTeamChatState>(initialState);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);

  const appendMessage = useEffectEvent((message: TeamChatMessage) => {
    startTransition(() => {
      setChatState((current) => ({
        ...current,
        messages: mergeMessages(current.messages, message),
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
    if (!enabled) {
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

      const socket = createPlayerTeamChatSocket(sessionCode, participantId);
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
          setChatError('Не удалось обработать входящее сообщение команды.');
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
        setChatError('Соединение чата временно недоступно. Выполняется переподключение.');
      };
    };

    const loadChat = async () => {
      setChatState((current) => ({ ...current, loading: true, error: '' }));

      try {
        const payload = await fetchPlayerTeamChat(sessionCode, participantId);

        if (disposed) {
          return;
        }

        startTransition(() => {
          setChatState({
            loading: false,
            error: '',
            connectionStatus: 'idle',
            messages: payload.messages,
          });
        });

        connect(false);
      } catch (error) {
        if (disposed) {
          return;
        }

        setChatState({
          loading: false,
          error: error instanceof Error ? error.message : 'Не удалось загрузить чат команды.',
          connectionStatus: 'closed',
          messages: [],
        });
      }
    };

    void loadChat();

    return () => {
      disposed = true;
      clearReconnectTimer();
      closeSocket();
    };
  }, [enabled, sessionCode, participantId]);

  const sendMessage = (messageText: string): boolean => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage) {
      setChatError('Введите текст сообщения.');
      return false;
    }

    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setChatError('Чат пока переподключается. Сообщение можно отправить через пару секунд.');
      return false;
    }

    setChatError('');
    socketRef.current.send(JSON.stringify({ messageText: trimmedMessage }));
    return true;
  };

  return {
    chatState,
    sendMessage,
  };
}
