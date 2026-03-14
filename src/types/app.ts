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

export interface JoinState {
  loading: boolean;
  error: string;
  session: PlayerSession | null;
}
