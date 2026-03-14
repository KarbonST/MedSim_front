import type { Mode } from '../types/app';

interface ModeSwitchProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

function ModeSwitch({ mode, onChange }: ModeSwitchProps) {
  return (
    <div className="mode-switch" role="tablist" aria-label="Тип входа">
      <button
        type="button"
        className={mode === 'player' ? 'mode-button active' : 'mode-button'}
        onClick={() => onChange('player')}
      >
        Игрок
      </button>
      <button
        type="button"
        className={mode === 'staff' ? 'mode-button active' : 'mode-button'}
        onClick={() => onChange('staff')}
      >
        Ведущий / суперпользователь
      </button>
    </div>
  );
}

export default ModeSwitch;
