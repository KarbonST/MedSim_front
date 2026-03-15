import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { ChatConnectionStatus, TeamChatMessage } from '../types/app';

interface TeamChatFeedProps {
  title: string;
  subtitle?: string;
  messages: TeamChatMessage[];
  loading: boolean;
  connectionStatus: ChatConnectionStatus;
  emptyText: string;
  currentParticipantId?: number | null;
  footer?: ReactNode;
}

function getConnectionStatusLabel(connectionStatus: ChatConnectionStatus): string {
  switch (connectionStatus) {
    case 'connecting':
      return 'Подключение';
    case 'open':
      return 'Онлайн';
    case 'reconnecting':
      return 'Переподключение';
    case 'closed':
      return 'Нет связи';
    default:
      return 'Ожидание';
  }
}

function formatChatTime(createdAt: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(createdAt));
}

function TeamChatFeed({
  title,
  subtitle,
  messages,
  loading,
  connectionStatus,
  emptyText,
  currentParticipantId = null,
  footer,
}: TeamChatFeedProps) {
  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <article className="team-chat-feed">
      <div className="team-chat-feed-header">
        <div>
          <strong>{title}</strong>
          {subtitle ? <p className="participant-role-subtitle">{subtitle}</p> : null}
        </div>
        <span className="status-pill subtle-status-pill team-chat-connection-pill">
          {getConnectionStatusLabel(connectionStatus)}
        </span>
      </div>

      <div ref={messagesRef} className="team-chat-messages">
        {loading ? <p className="team-chat-empty">Загружаем сообщения...</p> : null}
        {!loading && !messages.length ? <p className="team-chat-empty">{emptyText}</p> : null}
        {messages.map((message) => {
          const isOwnMessage = currentParticipantId != null && message.participantId === currentParticipantId;

          return (
            <article
              key={message.id}
              className={isOwnMessage ? 'team-chat-message own-chat-message' : 'team-chat-message'}
            >
              <div className="team-chat-message-meta">
                <strong>{message.authorName}</strong>
                <span>{formatChatTime(message.createdAt)}</span>
              </div>
              <p>{message.messageText}</p>
            </article>
          );
        })}
      </div>

      {footer}
    </article>
  );
}

export default TeamChatFeed;
