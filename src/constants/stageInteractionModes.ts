import type { StageInteractionMode } from '../types/app';

export interface StageInteractionModeOption {
  value: StageInteractionMode;
  label: string;
  hint: string;
}

export const stageInteractionModes: StageInteractionModeOption[] = [
  {
    value: 'CHAT_WITH_PROBLEMS',
    label: 'Чат с проблемами',
    hint: 'Проблемы доступны и влияют на экономику, но вместо доски игроки работают через плоский список и чат.',
  },
  {
    value: 'CHAT_AND_KANBAN',
    label: 'Чат + канбан',
    hint: 'На этапе доступны и чат, и канбан-доска.',
  },
];
