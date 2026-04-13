import type { ProblemSeverity } from '../types/app';

export interface HospitalPlanRoomLayout {
  id: string;
  roomCode: string;
  fallbackName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  labelVariant?: 'horizontal' | 'vertical';
  labelLines?: string[];
}

export const hospitalPlanRoomLayouts: HospitalPlanRoomLayout[] = [
  {
    id: 'xray',
    roomCode: 'XRAY',
    fallbackName: 'Рентген',
    x: 28,
    y: 24,
    width: 244,
    height: 92,
    labelLines: ['Рентген'],
  },
  {
    id: 'ultrasound',
    roomCode: 'ULTRASOUND',
    fallbackName: 'УЗИ',
    x: 32,
    y: 122,
    width: 84,
    height: 158,
    labelVariant: 'vertical',
    labelLines: ['УЗИ'],
  },
  {
    id: 'mri',
    roomCode: 'MRI',
    fallbackName: 'МРТ',
    x: 184,
    y: 122,
    width: 84,
    height: 158,
    labelVariant: 'vertical',
    labelLines: ['МРТ'],
  },
  {
    id: 'exam-1',
    roomCode: 'EXAM_1',
    fallbackName: 'Смотровая №1',
    x: 32,
    y: 286,
    width: 84,
    height: 112,
    labelVariant: 'vertical',
    labelLines: ['Смотровая', '№1'],
  },
  {
    id: 'exam-2',
    roomCode: 'EXAM_2',
    fallbackName: 'Смотровая №2',
    x: 184,
    y: 286,
    width: 84,
    height: 112,
    labelVariant: 'vertical',
    labelLines: ['Смотровая', '№2'],
  },
  {
    id: 'procedure',
    roomCode: 'PROCEDURE',
    fallbackName: 'Процедурная',
    x: 32,
    y: 404,
    width: 84,
    height: 112,
    labelVariant: 'vertical',
    labelLines: ['Процедурная'],
  },
  {
    id: 'gynecology',
    roomCode: 'GYNECOLOGY',
    fallbackName: 'Гинекология',
    x: 184,
    y: 404,
    width: 84,
    height: 112,
    labelVariant: 'vertical',
    labelLines: ['Гинекология'],
  },
  {
    id: 'toilet-w',
    roomCode: 'WOMEN_TOILET',
    fallbackName: 'Туалет женский',
    x: 32,
    y: 522,
    width: 84,
    height: 72,
    labelLines: ['Туалет', 'женский'],
  },
  {
    id: 'toilet-m',
    roomCode: 'MEN_TOILET',
    fallbackName: 'Туалет мужской',
    x: 184,
    y: 522,
    width: 84,
    height: 72,
    labelLines: ['Туалет', 'мужской'],
  },
  {
    id: 'registry',
    roomCode: 'REGISTRY_HALL',
    fallbackName: 'Регистратура',
    x: 28,
    y: 600,
    width: 244,
    height: 94,
    labelLines: ['Регистратура'],
  },
  {
    id: 'hall',
    roomCode: 'REGISTRY_HALL',
    fallbackName: 'Коридор',
    x: 120,
    y: 122,
    width: 60,
    height: 472,
    labelVariant: 'vertical',
    labelLines: ['Коридор'],
  },
];

export function getHospitalRoomState(
  problemCount: number,
  worstProblemSeverity?: ProblemSeverity | null,
): 'normal' | 'warning' | 'critical' {
  if (worstProblemSeverity === 'CRITICAL') {
    return 'critical';
  }

  if (worstProblemSeverity === 'SERIOUS') {
    return 'warning';
  }

  if (problemCount >= 5) {
    return 'critical';
  }

  if (problemCount >= 3) {
    return 'warning';
  }

  return 'normal';
}
