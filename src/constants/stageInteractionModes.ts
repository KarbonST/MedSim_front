import type { StageInteractionMode } from '../types/app';

export interface StageInteractionModeOption {
  value: StageInteractionMode;
  label: string;
  hint: string;
}

export const stageInteractionModes: StageInteractionModeOption[] = [
  {
    value: 'CHAT_ONLY',
    label: 'Только чат',
    hint: 'Игроки общаются внутри этапа без доступа к доске задач.',
  },
  {
    value: 'CHAT_AND_KANBAN',
    label: 'Чат + канбан',
    hint: 'На этапе доступны и чат, и канбан-доска.',
  },
];
