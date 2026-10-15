export type ScheduleWarningCode =
  | 'overlap'
  | 'before_course_start'
  | 'after_course_end'
  | 'before_release'
  | 'due_before_session';

export interface ScheduleWarning {
  code: ScheduleWarningCode;
  params: {
    sectionId?: string;
    displayName?: string;
    /** ISO date (YYYY-MM-DD) in the course timezone. */
    date?: string;
  };
}

/** A section's saved schedule. Dates and times are wall-clock values in the course timezone. */
export interface SectionScheduleData {
  startDate: string;
  endDate: string;
  numDays: number;
  startTime: string | null;
  endTime: string | null;
  timezoneAbbr: string;
  instructor: string;
  toolsRequired: string;
  notes: string;
}

export interface ScheduleSection {
  sectionId: string;
  displayName: string;
  releaseDate: string | null;
  schedule: SectionScheduleData | null;
  warnings: ScheduleWarning[];
}

export interface CourseSchedule {
  enabled: boolean;
  selfPaced: boolean;
  course: { start: string | null; end: string | null };
  timezone: string;
  /** Every section of the course, in outline order. */
  sections: ScheduleSection[];
  scheduledCount: number;
  totalCount: number;
}

/** One section's schedule as sent to the API. */
export interface ScheduleInput {
  sectionId: string;
  startDate: string;
  numDays: number;
  startTime: string | null;
  endTime: string | null;
  instructor: string;
  toolsRequired: string;
  notes: string;
}

export interface ScheduleUpdate {
  timezone?: string;
  upsert?: ScheduleInput[];
  remove?: string[];
}
