import type { AccessProfile } from '../types/app';

export const accessProfiles: AccessProfile[] = [
  {
    id: 'facilitator',
    label: 'Ведущий',
    hint: 'Управление этапами, таймером, ролями и итогами игры.',
  },
  {
    id: 'superuser',
    label: 'Суперпользователь',
    hint: 'Расширенный доступ к системным настройкам и сценариям.',
  },
];
