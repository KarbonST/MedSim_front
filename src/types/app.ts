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

export type StageInteractionMode = 'CHAT_ONLY' | 'CHAT_WITH_PROBLEMS' | 'CHAT_AND_KANBAN';
export type SessionTimerStatus = 'STOPPED' | 'RUNNING' | 'PAUSED';
export type ProblemSeverity = 'MINOR' | 'SERIOUS' | 'CRITICAL';
export type TeamProblemStatus = 'ACTIVE' | 'IN_PROGRESS' | 'RESOLVED' | 'IGNORED';
export type KanbanCardStatus =
  | 'REGISTERED'
  | 'ASSIGNED'
  | 'READY_FOR_WORK'
  | 'IN_PROGRESS'
  | 'DEPARTMENT_REVIEW'
  | 'CHIEF_DOCTOR_REVIEW'
  | 'REWORK'
  | 'DONE';
export type KanbanCardPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type KanbanResponsibleDepartment = 'NURSING' | 'ENGINEERING';
export type KanbanCardHistoryEventType =
  | 'PRIORITY_SET'
  | 'DEPARTMENT_ASSIGNED'
  | 'EXECUTOR_ASSIGNED'
  | 'WORK_STARTED'
  | 'SENT_TO_DEPARTMENT_REVIEW'
  | 'DEPARTMENT_APPROVED'
  | 'CHIEF_DOCTOR_APPROVED'
  | 'RETURNED_TO_STAGE';

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
  kanbanNotifications: PlayerKanbanNotificationItem[];
  teamKanbanBoard: TeamKanbanBoardItem | null;
  teamEconomy: TeamEconomyItem | null;
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

export interface SessionEconomySettings {
  startingBudget: number;
  stageTimeUnits: number;
}

export interface TeamProblemEconomyItem {
  problemStateId: number;
  problemNumber: number;
  stageNumber: number;
  title: string;
  severity: ProblemSeverity;
  budgetCost: number;
  timeCost: number;
  requiredItemName: string | null;
  requiredItemQuantity: number;
  ignorePenalty: number;
  penaltyWeight: number;
  status: TeamProblemStatus;
}

export interface TeamRoomEconomyItem {
  roomStateId: number;
  roomCode: string;
  roomName: string;
  baseIncome: number;
  activeProblemCount: number;
  worstProblemSeverity: ProblemSeverity | null;
  stateCoefficient: number;
  problems: TeamProblemEconomyItem[];
}

export interface TeamEconomyItem {
  teamId: number;
  teamName: string;
  currentBalance: number;
  currentStageTimeUnits: number;
  totalIncome: number;
  totalExpenses: number;
  totalPenalties: number;
  totalBonuses: number;
  rooms: TeamRoomEconomyItem[];
  recentEvents: TeamEconomyEventItem[];
}

export interface TeamKanbanCardItem {
  cardId: number;
  problemStateId: number;
  problemNumber: number;
  stageNumber: number;
  title: string;
  roomCode: string;
  roomName: string;
  severity: ProblemSeverity;
  priority: KanbanCardPriority | null;
  budgetCost: number;
  timeCost: number;
  requiredItemName: string | null;
  requiredItemQuantity: number;
  resourcesSpent: boolean;
  responsibleDepartment: KanbanResponsibleDepartment | null;
  status: KanbanCardStatus;
  assigneeParticipantId: number | null;
  assigneeName: string | null;
  history: KanbanCardHistoryItem[];
}

export interface KanbanCardHistoryItem {
  eventId: number;
  eventType: KanbanCardHistoryEventType;
  message: string;
  actorName: string | null;
  actorRole: string | null;
  targetName: string | null;
  targetRole: string | null;
  priority: KanbanCardPriority | null;
  responsibleDepartment: KanbanResponsibleDepartment | null;
  createdAt: string;
}

export interface PlayerKanbanNotificationItem {
  notificationId: number;
  cardId: number;
  type: KanbanCardHistoryEventType;
  title: string;
  message: string;
  createdAt: string;
}

export interface TeamEconomyEventItem {
  eventId: number;
  eventType: 'TASK_RESOURCES_SPENT' | 'STAGE_SETTLED';
  stageNumber: number | null;
  amountDelta: number;
  timeDelta: number;
  itemName: string | null;
  itemQuantityDelta: number;
  message: string;
  createdAt: string;
}

export interface PlayerKanbanCardUpdateRequest {
  status: KanbanCardStatus;
  priority?: KanbanCardPriority;
  responsibleDepartment?: KanbanResponsibleDepartment;
  assigneeParticipantId?: number;
}

export interface TeamKanbanBoardItem {
  cards: TeamKanbanCardItem[];
}

export interface TeamKanbanOverviewItem {
  teamId: number;
  teamName: string;
  teamKanbanBoard: TeamKanbanBoardItem;
}

export interface GameSessionKanbanResponse {
  sessionId: number;
  sessionCode: string;
  sessionName: string;
  sessionStatus: string;
  teams: TeamKanbanOverviewItem[];
}

export interface GameSessionEconomyResponse {
  sessionId: number;
  sessionCode: string;
  sessionName: string;
  sessionStatus: string;
  settings: SessionEconomySettings;
  teams: TeamEconomyItem[];
}

export interface GameSessionEconomySettingsUpdateRequest {
  startingBudget: string;
  stageTimeUnits: number;
}

export interface GameSessionCreateRequest {
  sessionName: string;
  teamCount: number;
  startingBudget: string;
  stageTimeUnits: number;
}

export interface GameSessionRenameRequest {
  sessionName: string;
}

export interface GameSessionTeamRenameRequest {
  teamName: string;
}

export interface GameSessionTeamAssignmentRequest {
  teamId: number | null;
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
