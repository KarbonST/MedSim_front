import type { SessionRuntime } from '../types/app';

export function getRuntimeRemainingSeconds(
  runtime: SessionRuntime | null | undefined,
  nowMs: number = Date.now(),
): number | null {
  if (!runtime || runtime.remainingSeconds == null) {
    return null;
  }

  if (runtime.timerStatus !== 'RUNNING' || !runtime.timerEndsAt) {
    return runtime.remainingSeconds;
  }

  const endMs = new Date(runtime.timerEndsAt).getTime();

  if (Number.isNaN(endMs)) {
    return runtime.remainingSeconds;
  }

  return Math.max(Math.ceil((endMs - nowMs) / 1000), 0);
}

export function formatRuntimeDuration(totalSeconds: number | null): string {
  if (totalSeconds == null) {
    return '--:--';
  }

  const safeSeconds = Math.max(totalSeconds, 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function getInteractionModeLabel(interactionMode: SessionRuntime['activeStageInteractionMode']): string {
  if (interactionMode === 'CHAT_AND_KANBAN') {
    return 'Чат и канбан';
  }

  if (interactionMode === 'CHAT_ONLY') {
    return 'Только чат';
  }

  return 'Пока не выбрано';
}

export function getTimerStatusLabel(timerStatus: SessionRuntime['timerStatus']): string {
  if (timerStatus === 'RUNNING') {
    return 'Таймер идёт';
  }

  if (timerStatus === 'PAUSED') {
    return 'Таймер на паузе';
  }

  return 'Таймер готов';
}
