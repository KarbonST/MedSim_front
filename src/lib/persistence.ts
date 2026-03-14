import type {
  AccessProfileId,
  Mode,
  PlayerFormState,
  PlayerSession,
} from '../types/app';

const APP_STATE_KEY = 'medsim.app-state';

interface PersistedStaffState {
  profile: AccessProfileId;
  login: string;
}

interface PersistedFacilitatorState {
  authHeader: string;
  isWorkspaceOpen: boolean;
  sessionCode: string;
}

export interface PersistedAppState {
  mode: Mode;
  playerForm: PlayerFormState;
  playerSession: PlayerSession | null;
  staff: PersistedStaffState;
  facilitator: PersistedFacilitatorState;
}

export const defaultPersistedAppState: PersistedAppState = {
  mode: 'player',
  playerForm: {
    name: '',
    hospitalRole: '',
    sessionCode: '',
  },
  playerSession: null,
  staff: {
    profile: 'facilitator',
    login: '',
  },
  facilitator: {
    authHeader: '',
    isWorkspaceOpen: false,
    sessionCode: '',
  },
};

export function readPersistedAppState(): PersistedAppState {
  if (typeof window === 'undefined') {
    return defaultPersistedAppState;
  }

  const rawState = window.localStorage.getItem(APP_STATE_KEY);

  if (!rawState) {
    return defaultPersistedAppState;
  }

  try {
    const parsedState = JSON.parse(rawState) as Partial<PersistedAppState>;

    return {
      mode: parsedState.mode ?? defaultPersistedAppState.mode,
      playerForm: {
        ...defaultPersistedAppState.playerForm,
        ...parsedState.playerForm,
      },
      playerSession: parsedState.playerSession ?? null,
      staff: {
        ...defaultPersistedAppState.staff,
        ...parsedState.staff,
      },
      facilitator: {
        ...defaultPersistedAppState.facilitator,
        ...parsedState.facilitator,
      },
    };
  } catch {
    return defaultPersistedAppState;
  }
}

export function writePersistedAppState(state: PersistedAppState): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(APP_STATE_KEY, JSON.stringify(state));
}
