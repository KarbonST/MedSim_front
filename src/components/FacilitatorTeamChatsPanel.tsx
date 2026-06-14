import CollapsibleSection from './CollapsibleSection';
import TeamChatFeed from './TeamChatFeed';
import { useFacilitatorTeamChats } from '../hooks/useFacilitatorTeamChats';

interface FacilitatorTeamChatsPanelProps {
  sessionCode: string;
  authHeader: string;
}

function FacilitatorTeamChatsPanel({
  sessionCode,
  authHeader,
}: FacilitatorTeamChatsPanelProps) {
  const { chatState } = useFacilitatorTeamChats({
    sessionCode,
    authHeader,
    enabled: true,
  });

  return (
    <CollapsibleSection
      kicker="Чаты команд"
      title="Переписка обеих команд"
      className="facilitator-live-panel"
      defaultExpanded
      badge={(
        <span className="status-pill subtle-status-pill">
          {chatState.loading ? 'Загрузка чатов...' : `Чатов: ${chatState.teamChats.length}`}
        </span>
      )}
    >
      <div className="waiting-note compact-note">
        <p>Сообщения обеих команд собраны в одном месте для контроля ведущего.</p>
      </div>

      <div className="facilitator-team-chat-grid">
        {chatState.teamChats.map((teamChat) => (
          <TeamChatFeed
            key={teamChat.teamId}
            title={teamChat.teamName}
            subtitle={`Команда ${teamChat.sortOrder}`}
            messages={teamChat.messages}
            loading={chatState.loading}
            connectionStatus={chatState.connectionStatus}
            emptyText="В этой команде пока нет сообщений."
          />
        ))}
      </div>

      {chatState.error ? <p className="form-error">{chatState.error}</p> : null}
    </CollapsibleSection>
  );
}

export default FacilitatorTeamChatsPanel;
