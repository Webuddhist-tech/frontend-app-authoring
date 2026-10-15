import type { CourseSchedule, ScheduleSection, SectionScheduleData } from './data/types';

export const courseId = 'course-v1:WBA+BCA101+2026';

export const scheduleOf = (overrides: Partial<SectionScheduleData> = {}): SectionScheduleData => ({
  startDate: '2026-10-12',
  endDate: '2026-10-12',
  numDays: 1,
  startTime: '19:00',
  endTime: '20:30',
  timezoneAbbr: 'IST',
  instructor: '',
  toolsRequired: '',
  notes: '',
  ...overrides,
});

export const sectionOf = (index: number, schedule: SectionScheduleData | null = null): ScheduleSection => ({
  sectionId: `block-v1:WBA+BCA101+2026+type@chapter+block@s${index}`,
  displayName: `Lesson ${index}`,
  releaseDate: null,
  schedule,
  warnings: [],
});

/** Snake-case API payload, as the server sends it. */
export const apiPayload = (sections: ScheduleSection[], overrides: Partial<CourseSchedule> = {}) => {
  const toSnake = (key: string) => key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  const snake = (value: any): any => {
    if (Array.isArray(value)) {
      return value.map(snake);
    }
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [toSnake(key), snake(item)]));
    }
    return value;
  };
  return snake({
    enabled: true,
    selfPaced: false,
    course: { start: '2026-10-01T00:00:00+00:00', end: null },
    timezone: 'Asia/Kolkata',
    sections,
    scheduledCount: sections.filter((section) => section.schedule).length,
    totalCount: sections.length,
    ...overrides,
  });
};

export const timezoneNames = ['Asia/Kathmandu', 'Asia/Kolkata', 'UTC'];
