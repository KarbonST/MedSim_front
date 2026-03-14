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

export interface SessionParticipantSummary {
  participantId: number;
  playerId: number;
  displayName: string;
  hospitalPosition: string;
  gameRole: string | null;
  joinedAt: string;
}

export interface GameSessionSummary {
  sessionId: number;
  sessionCode: string;
  sessionName: string;
  sessionStatus: string;
  participantCount: number;
}

export interface GameSessionParticipantsResponse {
  sessionId: number;
  sessionCode: string;
  sessionName: string;
  sessionStatus: string;
  participants: SessionParticipantSummary[];
}

export interface JoinState {
  loading: boolean;
  error: string;
  session: PlayerSession | null;
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
