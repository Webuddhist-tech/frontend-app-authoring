import { createIntl } from '@edx/frontend-platform/i18n';

import { scheduleOf, sectionOf } from './testData';
import {
  addDays, autofill, daysBetween, formatDuration, formatSessionSummary, getErrorMessage, shiftDelta, shiftLater,
  toInput,
  validateInput,
} from './utils';

const intl = createIntl({ locale: 'en-GB', onError: () => {} });

describe('date arithmetic', () => {
  it('adds days across months', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-11-01', -1)).toBe('2026-10-31');
  });

  it('counts days between dates', () => {
    expect(daysBetween('2026-10-12', '2026-10-14')).toBe(2);
    expect(daysBetween('2026-10-14', '2026-10-12')).toBe(-2);
  });
});

describe('autofill', () => {
  it('schedules back to back, respecting each length and copying only the time', () => {
    const inputs = [
      toInput(sectionOf(1)),
      { ...toInput(sectionOf(2, scheduleOf({ numDays: 2, instructor: 'Ani Pema', startTime: '08:00' }))) },
      toInput(sectionOf(3)),
    ];
    const filled = autofill(inputs, '2026-10-12', '19:00', '20:30');
    expect(filled.map((input) => [input.startDate, input.numDays])).toEqual([
      ['2026-10-12', 1], ['2026-10-13', 2], ['2026-10-15', 1],
    ]);
    expect(filled.every((input) => input.startTime === '19:00' && input.endTime === '20:30')).toBe(true);
    expect(filled[1].instructor).toBe('Ani Pema');
  });
});

describe('shiftLater', () => {
  const sections = [
    sectionOf(1, scheduleOf({ startDate: '2026-10-12' })),
    sectionOf(2, scheduleOf({ startDate: '2026-10-13' })),
    sectionOf(3),
    sectionOf(4, scheduleOf({ startDate: '2026-10-20' })),
  ];

  it('moves only scheduled sections after the given one, keeping gaps', () => {
    const moved = shiftLater(sections.map(toInput), sections[1].sectionId, 2);
    expect(moved.map((input) => [input.sectionId, input.startDate])).toEqual([
      [sections[3].sectionId, '2026-10-22'],
    ]);
  });

  it('moves nothing for a zero delta or unknown section', () => {
    expect(shiftLater(sections.map(toInput), sections[0].sectionId, 0)).toEqual([]);
    expect(shiftLater(sections.map(toInput), 'missing', 3)).toEqual([]);
  });

  const before = { startDate: '2026-10-13', numDays: 1 };

  it('measures the delta from the end of the section', () => {
    expect(shiftDelta(before, { startDate: '2026-10-15', numDays: 1 })).toBe(2);
    expect(shiftDelta(before, { startDate: '2026-10-13', numDays: 2 })).toBe(1);
    expect(shiftDelta(before, { startDate: '2026-10-12', numDays: 1 })).toBe(-1);
    expect(shiftDelta({ startDate: '', numDays: 1 }, before)).toBe(0);
  });

  it('is zero, not an error, while the days field is cleared and retyped', () => {
    const cleared = { startDate: '2026-10-13', numDays: NaN };
    expect(shiftDelta(before, cleared)).toBe(0);
    expect(shiftDelta(cleared, { startDate: '2026-10-13', numDays: 2 })).toBe(0);
  });
});

describe('formatDuration', () => {
  it('formats same-day and overnight sessions', () => {
    expect(formatDuration(intl, '19:00', '20:30')).toBe('1 hr 30 min');
    expect(formatDuration(intl, '19:00', '19:45')).toBe('45 min');
    expect(formatDuration(intl, '22:00', '00:30')).toBe('2 hr 30 min, ends next day');
    expect(formatDuration(intl, '19:00', '19:00')).toBeNull();
    expect(formatDuration(intl, '19:00', null)).toBeNull();
  });
});

describe('formatSessionSummary', () => {
  it('formats one day with times', () => {
    expect(formatSessionSummary(intl, scheduleOf())).toBe('Mon 12 Oct · 19:00–20:30 IST');
  });

  it('formats several days without times', () => {
    const schedule = scheduleOf({
      startDate: '2026-10-13', endDate: '2026-10-14', numDays: 2, startTime: null, endTime: null,
    });
    expect(formatSessionSummary(intl, schedule)).toBe('Tue 13 Oct – Wed 14 Oct');
  });
});

describe('validateInput', () => {
  const valid = { ...toInput(sectionOf(1)), startDate: '2026-10-12' };

  it('accepts a valid input', () => {
    expect(validateInput(intl, valid)).toEqual({});
  });

  it('flags missing dates, bad lengths and bad times', () => {
    expect(Object.keys(validateInput(intl, { ...valid, startDate: '' }))).toEqual(['startDate']);
    expect(Object.keys(validateInput(intl, { ...valid, numDays: 0 }))).toEqual(['numDays']);
    expect(Object.keys(validateInput(intl, { ...valid, endTime: '10:00' }))).toEqual(['startTime']);
    expect(Object.keys(validateInput(intl, { ...valid, startTime: '10:00', endTime: '10:00' }))).toEqual(['endTime']);
  });

  it('accepts an end time after midnight, for sessions that end the next day', () => {
    expect(validateInput(intl, { ...valid, startTime: '22:00', endTime: '00:30' })).toEqual({});
  });
});

describe('getErrorMessage', () => {
  it('reads the API error, nested field errors, or falls back', () => {
    expect(getErrorMessage({ response: { data: { error: 'Nope.' } } }, 'x')).toBe('Nope.');
    expect(getErrorMessage({ response: { data: { upsert: [{ end_time: ['Too early.'] }] } } }, 'x')).toBe('Too early.');
    expect(getErrorMessage({}, 'Fallback')).toBe('Fallback');
  });
});
