import type { SessionRuntime } from '../types/app';

export function getRuntimeRemainingSeconds(
  runtime: SessionRuntime | null | undefined,
  nowMs: number = Date.now(),
  syncedAtMs: number | null = null,
): number | null {
  if (!runtime || runtime.remainingSeconds == null) {
    return null;
  }

  if (runtime.timerStatus !== 'RUNNING') {
    return runtime.remainingSeconds;
  }

  if (syncedAtMs == null) {
    return runtime.remainingSeconds;
  }

  const elapsedSeconds = Math.max(Math.floor((nowMs - syncedAtMs) / 1000), 0);
  return Math.max(runtime.remainingSeconds - elapsedSeconds, 0);
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

  if (interactionMode === 'CHAT_WITH_PROBLEMS') {
    return 'Чат с проблемами';
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
