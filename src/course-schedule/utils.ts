import type { IntlShape } from 'react-intl';

import messages from './messages';
import type {
  ScheduleInput, ScheduleSection, ScheduleWarning, SectionScheduleData,
} from './data/types';

/*
 * Schedule dates and times are wall-clock values in the course timezone
 * ("2026-10-12", "19:00"), never instants. All arithmetic and formatting here
 * goes through UTC so the browser's own timezone can't shift a date.
 */

/** The longest a section can run, matching the API's limit. */
export const MAX_NUM_DAYS = 365;

const toUtcDate = (isoDate: string) => new Date(`${isoDate}T00:00:00Z`);

export const addDays = (isoDate: string, days: number) => {
  const date = toUtcDate(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export const daysBetween = (fromIsoDate: string, toIsoDate: string) => (
  Math.round((toUtcDate(toIsoDate).getTime() - toUtcDate(fromIsoDate).getTime()) / 86400000)
);

export const endDateOf = (startDate: string, numDays: number) => addDays(startDate, numDays - 1);

/** Every day a session covers, as ISO dates. */
export const daysOf = (startDate: string, numDays: number) => (
  Array.from({ length: Math.max(1, numDays || 1) }, (_, day) => addDays(startDate, day))
);

const pad = (value: number) => String(value).padStart(2, '0');

/*
 * react-datepicker works with Date objects in the browser's timezone. Our
 * values are plain wall-clock strings, so they are converted through local
 * date parts only; no timezone conversion ever happens.
 */
export const isoToLocalDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
};
export const localDateToIso = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
export const timeToLocalDate = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(2000, 0, 1, hours, minutes);
};
export const localDateToTime = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

/** True when a session runs past midnight: its end time is earlier than its start time. */
export const endsNextDay = (startTime: string | null, endTime: string | null) => (
  !!startTime && !!endTime && endTime < startTime
);

/**
 * e.g. "1 hr 30 min" between "19:00" and "20:30", or "2 hr 30 min, ends next day"
 * between "22:00" and "00:30". Null without both times, or when they're equal.
 */
export const formatDuration = (intl: IntlShape, startTime: string | null, endTime: string | null) => {
  if (!startTime || !endTime || endTime === startTime) {
    return null;
  }
  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  const overnight = endsNextDay(startTime, endTime);
  const total = toMinutes(endTime) - toMinutes(startTime) + (overnight ? 24 * 60 : 0);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  let duration;
  if (!hours) {
    duration = intl.formatMessage(messages.durationMinutes, { minutes });
  } else {
    duration = minutes
      ? intl.formatMessage(messages.durationHoursMinutes, { hours, minutes })
      : intl.formatMessage(messages.durationHours, { hours });
  }
  return overnight ? intl.formatMessage(messages.durationNextDay, { duration }) : duration;
};

/** An editable copy of a section's schedule, or an empty one if it has none. */
export const toInput = (section: ScheduleSection): ScheduleInput => ({
  sectionId: section.sectionId,
  startDate: section.schedule?.startDate ?? '',
  numDays: section.schedule?.numDays ?? 1,
  startTime: section.schedule?.startTime ?? null,
  endTime: section.schedule?.endTime ?? null,
  instructor: section.schedule?.instructor ?? '',
  toolsRequired: section.schedule?.toolsRequired ?? '',
  notes: section.schedule?.notes ?? '',
});

/**
 * Schedule `inputs` back to back from `startDate`.
 *
 * Each section keeps its own length (default 1 day), so a 2-day section pushes
 * the next one along by 2 days. Only the times are copied; each section keeps
 * its own instructor, tools and notes.
 */
export const autofill = (
  inputs: ScheduleInput[],
  startDate: string,
  startTime: string | null,
  endTime: string | null,
): ScheduleInput[] => {
  let nextDate = startDate;
  return inputs.map((input) => {
    const filled = {
      ...input, startDate: nextDate, startTime, endTime,
    };
    nextDate = addDays(nextDate, filled.numDays || 1);
    return filled;
  });
};

/**
 * Move every scheduled section after `sectionId` by `deltaDays`.
 *
 * `inputs` is every section in outline order; unscheduled ones have no start
 * date and stay unscheduled. Earlier sections are untouched, and moving all
 * later ones by the same amount keeps any gaps the creator left on purpose.
 * Returns only the sections that move.
 */
export const shiftLater = (inputs: ScheduleInput[], sectionId: string, deltaDays: number): ScheduleInput[] => {
  const index = inputs.findIndex((input) => input.sectionId === sectionId);
  if (index === -1 || deltaDays === 0) {
    return [];
  }
  return inputs.slice(index + 1)
    .filter((input) => input.startDate)
    .map((input) => ({ ...input, startDate: addDays(input.startDate, deltaDays) }));
};

/** How many days the sections after a section move when it changes from `before` to `after`. */
export const shiftDelta = (before: Pick<ScheduleInput, 'startDate' | 'numDays'>, after: Pick<ScheduleInput, 'startDate' | 'numDays'>) => {
  // numDays is NaN while the creator has cleared the field to retype it.
  if (!before.startDate || !after.startDate || !(before.numDays >= 1) || !(after.numDays >= 1)) {
    return 0;
  }
  return daysBetween(endDateOf(before.startDate, before.numDays), endDateOf(after.startDate, after.numDays));
};

export type ScheduleFieldErrors = Partial<Record<'startDate' | 'numDays' | 'startTime' | 'endTime', string>>;

/** Client-side checks matching the API's; an empty object means the input is valid. */
export const validateInput = (intl: IntlShape, input: ScheduleInput): ScheduleFieldErrors => {
  const errors: ScheduleFieldErrors = {};
  if (!input.startDate) {
    errors.startDate = intl.formatMessage(messages.errorStartDateRequired);
  }
  if (!Number.isInteger(input.numDays) || input.numDays < 1 || input.numDays > MAX_NUM_DAYS) {
    errors.numDays = intl.formatMessage(messages.errorNumDays);
  }
  if (input.endTime && !input.startTime) {
    errors.startTime = intl.formatMessage(messages.errorEndTimeNeedsStart);
  } else if (input.startTime && input.endTime && input.endTime === input.startTime) {
    // An earlier end time is fine: the session runs past midnight.
    errors.endTime = intl.formatMessage(messages.errorSameTimes);
  }
  return errors;
};

/** e.g. "Mon, 12 Oct" in the user's locale. */
export const formatDay = (intl: IntlShape, isoDate: string) => intl.formatDate(toUtcDate(isoDate), {
  weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
});

/** e.g. "Tue, Oct 13, 2026", like the learner Dates page's day headings. */
export const formatFullDay = (intl: IntlShape, isoDate: string) => intl.formatDate(toUtcDate(isoDate), {
  weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
});

/** e.g. "7:00 PM" for "19:00". */
export const formatClock = (intl: IntlShape, time: string) => intl.formatTime(new Date(`1970-01-01T${time}:00Z`), {
  hour: 'numeric', minute: '2-digit', timeZone: 'UTC',
});

/** e.g. "Mon, 12 Oct · 7:00 PM–8:30 PM IST", or "Tue, 13 Oct – Wed, 14 Oct" for several days. */
export const formatSessionSummary = (intl: IntlShape, schedule: SectionScheduleData) => {
  const days = schedule.numDays > 1
    ? `${formatDay(intl, schedule.startDate)} – ${formatDay(intl, schedule.endDate)}`
    : formatDay(intl, schedule.startDate);
  if (!schedule.startTime) {
    return days;
  }
  const times = schedule.endTime
    ? `${formatClock(intl, schedule.startTime)}–${formatClock(intl, schedule.endTime)}`
    : formatClock(intl, schedule.startTime);
  return `${days} · ${times} ${schedule.timezoneAbbr}`;
};

export const formatWarning = (intl: IntlShape, warning: ScheduleWarning) => {
  const { displayName = '', date } = warning.params;
  const formattedDate = date ? formatDay(intl, date) : '';
  switch (warning.code) {
    case 'overlap':
      return intl.formatMessage(messages.warningOverlap, { displayName });
    case 'before_course_start':
      return intl.formatMessage(messages.warningBeforeCourseStart, { date: formattedDate });
    case 'after_course_end':
      return intl.formatMessage(messages.warningAfterCourseEnd, { date: formattedDate });
    case 'before_release':
      return intl.formatMessage(messages.warningBeforeRelease, { date: formattedDate });
    case 'due_before_session':
      return intl.formatMessage(messages.warningDueBeforeSession, { displayName, date: formattedDate });
    default:
      return '';
  }
};

const collectStrings = (value: unknown): string[] => {
  if (typeof value === 'string') {
    return [value];
  }
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(collectStrings);
  }
  return [];
};

/**
 * A readable message from a failed save, falling back to `fallback`.
 *
 * The API answers `{"error": "..."}`, or DRF field errors that may be nested
 * per section, e.g. `{"upsert": [{"end_time": ["..."]}]}`.
 */
export const getErrorMessage = (error: any, fallback: string) => {
  let data = error?.customAttributes?.httpErrorResponseData ?? error?.response?.data;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return fallback;
    }
  }
  if (typeof data?.error === 'string') {
    return data.error;
  }
  const messagesFound = [...new Set(collectStrings(data))];
  return messagesFound.length ? messagesFound.join(' ') : fallback;
};
