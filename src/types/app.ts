export type Mode = 'player' | 'staff';

export type AccessProfileId = 'facilitator' | 'superuser';

export interface AccessProfile {
  id: AccessProfileId;
  label: string;
  hint: string;
}

export interface PlayerFormState {
  name: string;
  hospitalRole: string;
  sessionCode: string;
}

export interface StaffFormState {
  profile: AccessProfileId;
  login: string;
  password: string;
}

export interface StaffProfile {
  login: string;
  systemRole: string;
}

export interface AvailablePlayerSession {
  sessionId: number;
  sessionCode: string;
  sessionName: string;
  participantCount: number;
}

export interface PlayerSessionJoinRequest {
  displayName: string;
  hospitalPosition: string;
  sessionCode: string;
}

export interface PlayerSession {
  participantId: number;
  playerId: number;
  sessionId: number;
  sessionCode: string;
  sessionName: string;
  sessionStatus: string;
  displayName: string;
  hospitalPosition: string;
  gameRole: string | null;
  joinedAt: string;
}

export interface PlayerTeamInventoryItem {
  itemName: string;
  quantity: number;
}

export interface PlayerTeamWorkspaceMember {
  participantId: number;
  displayName: string;
  hospitalPosition: string;
  gameRole: string | null;
  currentParticipant: boolean;
}

export type StageInteractionMode = 'CHAT_ONLY' | 'CHAT_AND_KANBAN';
export type SessionTimerStatus = 'STOPPED' | 'RUNNING' | 'PAUSED';

export interface SessionStageSetting {
  stageNumber: number;
  durationMinutes: number;
  interactionMode: StageInteractionMode;
}

export interface SessionRuntime {
  activeStageNumber: number | null;
  activeStageDurationMinutes: number | null;
  activeStageInteractionMode: StageInteractionMode | null;
  timerStatus: SessionTimerStatus;
  remainingSeconds: number | null;
  timerEndsAt: string | null;
}

export interface PlayerTeamWorkspace {
  participantId: number;
  playerId: number;
  sessionId: number;
  sessionCode: string;
  sessionName: string;
  sessionStatus: string;
  displayName: string;
  hospitalPosition: string;
  gameRole: string | null;
  teamId: number | null;
  teamName: string | null;
  teammates: PlayerTeamWorkspaceMember[];
  stages: SessionStageSetting[];
  sessionRuntime: SessionRuntime;
  inventoryVisible: boolean;
  teamInventory: PlayerTeamInventoryItem[];
}

export interface SessionParticipantSummary {
  participantId: number;
  playerId: number;
  displayName: string;
  hospitalPosition: string;
  teamId: number | null;
  teamName: string | null;
  gameRole: string | null;
  joinedAt: string;
}

export interface SessionTeamSummary {
  teamId: number;
  teamName: string;
  memberCount: number;
  sortOrder: number;
}

export interface GameSessionStageSettingsRequest {
  stages: SessionStageSetting[];
}

export interface GameSessionCreateRequest {
  sessionName: string;
  teamCount: number;
}

export interface GameSessionRenameRequest {
  sessionName: string;
}

export interface GameSessionTeamRenameRequest {
  teamName: string;
}

export interface GameSessionTeamAssignmentRequest {
  teamId: number;
}

export interface GameSessionRoleAssignmentRequest {
  gameRole: string;
}

export interface GameSessionRuntimeStageRequest {
  stageNumber: number;
}

export interface GameSessionSummary {
  sessionId: number;
  sessionCode: string;
  sessionName: string;
  sessionStatus: string;
  participantCount: number;
  teamCount: number;
  stageCount: number;
}

export interface GameSessionParticipantsResponse {
  sessionId: number;
  sessionCode: string;
  sessionName: string;
  sessionStatus: string;
  teams: SessionTeamSummary[];
  participants: SessionParticipantSummary[];
  stages: SessionStageSetting[];
  sessionRuntime: SessionRuntime;
}

export interface FacilitatorTeamChatsResponse {
  sessionCode: string;
  sessionName: string;
  teamChats: FacilitatorTeamChatThread[];
}

export interface TeamChatMessage {
  id: number;
  teamId: number;
  teamName: string;
  participantId: number;
  authorName: string;
  messageText: string;
  createdAt: string;
}

export interface PlayerTeamChatResponse {
  teamId: number;
  teamName: string;
  messages: TeamChatMessage[];
}

export interface FacilitatorTeamChatThread {
  teamId: number;
  teamName: string;
  sortOrder: number;
  messages: TeamChatMessage[];
}

export type ChatConnectionStatus = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed';

export interface JoinState {
  loading: boolean;
  error: string;
  session: PlayerSession | null;
}

export interface PlayerWorkspaceState {
  loading: boolean;
  error: string;
  workspace: PlayerTeamWorkspace | null;
}

export interface SessionOverviewState {
  loading: boolean;
  error: string;
  session: GameSessionParticipantsResponse | null;
}

export interface SessionsListState {
  loading: boolean;
  error: string;
  sessions: GameSessionSummary[];
}

export interface AvailablePlayerSessionsState {
  loading: boolean;
  error: string;
  sessions: AvailablePlayerSession[];
}
