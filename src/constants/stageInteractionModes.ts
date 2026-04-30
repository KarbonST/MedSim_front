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
    hint: 'Чат и общий список задач.',
  },
  {
    value: 'CHAT_AND_KANBAN',
    label: 'Чат + канбан',
    hint: 'Чат и канбан-доска.',
  },
];
