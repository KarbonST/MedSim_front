import type { FormEvent } from 'react';
import { useState } from 'react';
import BrandHeader from './components/BrandHeader';
import ModeSwitch from './components/ModeSwitch';
import PlayerEntryForm from './components/PlayerEntryForm';
import SessionWaitingRoom from './components/SessionWaitingRoom';
import StaffLoginForm from './components/StaffLoginForm';
import { accessProfiles } from './constants/accessProfiles';
import { playerRoles } from './constants/playerRoles';
import { usePlayerSession } from './hooks/usePlayerSession';
import type { Mode, PlayerFormState, StaffFormState } from './types/app';

function App() {
  const [mode, setMode] = useState<Mode>('player');
  const [playerForm, setPlayerForm] = useState<PlayerFormState>({
    name: '',
    hospitalRole: playerRoles[0],
    sessionCode: '',
  });
  const [staffForm, setStaffForm] = useState<StaffFormState>({
    profile: accessProfiles[0].id,
    login: '',
    password: '',
  });
  const { joinState, joinSession, resetSession } = usePlayerSession();

  const updatePlayerForm = (field: keyof PlayerFormState, value: string): void => {
    setPlayerForm((current) => ({ ...current, [field]: value }));
  };

  const updateStaffForm = (field: keyof StaffFormState, value: string): void => {
    setStaffForm((current) => ({ ...current, [field]: value }));
  };

  const handlePlayerSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    await joinSession(playerForm);
  };

  const handleStaffSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    console.log('staff login', staffForm);
  };

  const handleResetPlayerFlow = (): void => {
    resetSession();
    setPlayerForm((current) => ({ ...current, sessionCode: '' }));
  };

  return (
    <main className="page-shell">
      <section className="form-panel">
        {joinState.session ? (
          <SessionWaitingRoom session={joinState.session} onReset={handleResetPlayerFlow} />
        ) : (
          <>
            <BrandHeader
              eyebrow="Вход в систему симуляции"
              title="Регистрация и авторизация"
            />

            <ModeSwitch mode={mode} onChange={setMode} />

            {mode === 'player' ? (
              <PlayerEntryForm
                formState={playerForm}
                onChange={updatePlayerForm}
                onSubmit={handlePlayerSubmit}
                loading={joinState.loading}
                error={joinState.error}
              />
            ) : (
              <StaffLoginForm
                formState={staffForm}
                onChange={updateStaffForm}
                onSubmit={handleStaffSubmit}
              />
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default App;
