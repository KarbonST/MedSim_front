export interface HospitalPlanRoom {
  id: string;
  name: string;
  problemCount: number;
  income: number;
  problems: string[];
  x: number;
  y: number;
  width: number;
  height: number;
  labelVariant?: 'horizontal' | 'vertical';
  labelLines?: string[];
}

export const hospitalPlanRooms: HospitalPlanRoom[] = [
  {
    id: 'xray',
    name: 'Рентген',
    problemCount: 3,
    income: 3,
    problems: [
      'Водяные разводы на потолке',
      'Деффект аппарата (искрение)',
      'Испорченные свинцовые накидки',
    ],
    x: 28,
    y: 24,
    width: 244,
    height: 92,
    labelLines: ['Рентген'],
  },
  {
    id: 'ultrasound',
    name: 'УЗИ',
    problemCount: 6,
    income: 2.5,
    problems: [
      'Сломанные рольставни на окнах',
      'Неправильные ведра для отходов',
      'Трещины на поверхностях',
      'Надорваны кушетки',
      'Нестабильная работа ламп',
      'Мятые, грязные или надорванные простыни',
    ],
    x: 32,
    y: 122,
    width: 84,
    height: 158,
    labelVariant: 'vertical',
    labelLines: ['УЗИ'],
  },
  {
    id: 'mri',
    name: 'МРТ',
    problemCount: 4,
    income: 3,
    problems: [
      'Инвалидная коляска создаёт помехи',
      'Водяные разводы на потолке над оборудованием',
      'Электронные устройства вызывают помехи',
      'Катушка лежит прямо на аппарате',
    ],
    x: 184,
    y: 122,
    width: 84,
    height: 158,
    labelVariant: 'vertical',
    labelLines: ['МРТ'],
  },
  {
    id: 'exam-1',
    name: 'Смотровая №1',
    problemCount: 3,
    income: 1.5,
    problems: [
      'Лекарства просрочены или отсутствуют',
      'Градусник без футляра',
      'Ведра без маркировок',
    ],
    x: 32,
    y: 286,
    width: 84,
    height: 112,
    labelVariant: 'vertical',
    labelLines: ['Смотровая', '№1'],
  },
  {
    id: 'exam-2',
    name: 'Смотровая №2',
    problemCount: 4,
    income: 1.5,
    problems: [
      'Лампы не работают',
      'Искрится УФ-лампа',
      'Закончились перчатки',
      'Нерабочий ПК врача, синий экран',
    ],
    x: 184,
    y: 286,
    width: 84,
    height: 112,
    labelVariant: 'vertical',
    labelLines: ['Смотровая', '№2'],
  },
  {
    id: 'procedure',
    name: 'Процедурная',
    problemCount: 4,
    income: 2.5,
    problems: [
      'Хлам на полу',
      'Трещина в стене',
      'Личные вещи лежат рядом с перевязочными материалами',
      'Нужна повторная санитарная проверка помещения',
    ],
    x: 32,
    y: 404,
    width: 84,
    height: 112,
    labelVariant: 'vertical',
    labelLines: ['Процедурная'],
  },
  {
    id: 'gynecology',
    name: 'Гинекология',
    problemCount: 4,
    income: 2.5,
    problems: [
      'Ведра для отходов без крышки',
      'Сломана сидушка стула или отсутствует спинка',
      'Сломанный кран, нет горячей воды',
      'Закончился антисептик',
    ],
    x: 184,
    y: 404,
    width: 84,
    height: 112,
    labelVariant: 'vertical',
    labelLines: ['Гинекология'],
  },
  {
    id: 'toilet-w',
    name: 'Туалет женский',
    problemCount: 4,
    income: 1,
    problems: [
      'Отсутствует туалетная бумага',
      'Протекает раковина',
      'Сломанный кран, нет горячей воды',
      'Замечена мышь или крыса',
    ],
    x: 32,
    y: 522,
    width: 84,
    height: 72,
    labelLines: ['Туалет', 'женский'],
  },
  {
    id: 'toilet-m',
    name: 'Туалет мужской',
    problemCount: 2,
    income: 1,
    problems: [
      'Отсутствует мыло',
      'Протекает унитаз',
    ],
    x: 184,
    y: 522,
    width: 84,
    height: 72,
    labelLines: ['Туалет', 'мужской'],
  },
  {
    id: 'registry',
    name: 'Регистратура',
    problemCount: 3,
    income: 2,
    problems: [
      'Регистратор не работает',
      'Отсутствует план пожарной безопасности',
      'Отсутствует рециркулятор',
    ],
    x: 28,
    y: 600,
    width: 244,
    height: 94,
    labelLines: ['Регистратура'],
  },
  {
    id: 'hall',
    name: 'Коридор',
    problemCount: 3,
    income: 2,
    problems: [
      'Регистратор не работает',
      'Отсутствует план пожарной безопасности',
      'Отсутствует рециркулятор',
    ],
    x: 120,
    y: 122,
    width: 60,
    height: 472,
    labelVariant: 'vertical',
    labelLines: ['Коридор'],
  },
];

export function getHospitalRoomState(problemCount: number): 'normal' | 'warning' | 'critical' {
  if (problemCount >= 5) {
    return 'critical';
  }

  if (problemCount >= 3) {
    return 'warning';
  }

  return 'normal';
}
