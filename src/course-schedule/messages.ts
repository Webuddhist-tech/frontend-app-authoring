import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  // Section card badge
  badgeSetSchedule: {
    id: 'course-authoring.course-schedule.badge.set-schedule',
    defaultMessage: 'Add schedule',
    description: 'Chip on an unscheduled section card that opens the schedule form',
  },
  badgeAriaLabel: {
    id: 'course-authoring.course-schedule.badge.aria-label',
    defaultMessage: 'Schedule for {displayName}',
    description: 'Screen reader label of the schedule badge on a section card',
  },
  badgeTooltip: {
    id: 'course-authoring.course-schedule.badge.tooltip',
    defaultMessage: 'Class date shown to learners. Separate from the release date.',
    description: 'Hover message on the schedule chip, distinguishing it from the section release date',
  },
  badgeTooltipEmpty: {
    id: 'course-authoring.course-schedule.badge.tooltip-empty',
    defaultMessage: 'Add a class date for learners. Separate from the release date.',
    description: 'Hover message on the "Add schedule" chip of an unscheduled section',
  },
  badgeWarnings: {
    id: 'course-authoring.course-schedule.badge.warnings',
    defaultMessage: '{count, plural, one {# warning} other {# warnings}}',
    description: 'Screen reader text for the warning icon on a section schedule badge',
  },

  // Section schedule form
  modalEyebrow: {
    id: 'course-authoring.course-schedule.modal.eyebrow',
    defaultMessage: 'Schedule section',
    description: 'Small label above the section name in the schedule form header',
  },
  modalSectionNumber: {
    id: 'course-authoring.course-schedule.modal.section-number',
    defaultMessage: 'Section {number} of {total}',
    description: 'Position of the section in the course, under the schedule form title',
  },
  modalReleased: {
    id: 'course-authoring.course-schedule.modal.released',
    defaultMessage: 'Released {date}',
    description: "The section's release date, under the schedule form title",
  },
  whenTitle: {
    id: 'course-authoring.course-schedule.modal.when',
    defaultMessage: 'When',
    description: 'Heading of the date and time fields in the schedule form',
  },
  detailsTitle: {
    id: 'course-authoring.course-schedule.modal.details',
    defaultMessage: 'Details',
    description: 'Heading of the instructor, tools and notes fields in the schedule form',
  },
  optional: {
    id: 'course-authoring.course-schedule.modal.optional',
    defaultMessage: '(optional)',
    description: 'Marks optional fields in the schedule form',
  },
  timeLabel: {
    id: 'course-authoring.course-schedule.field.time',
    defaultMessage: 'Time',
    description: 'Label of the start and end time pair',
  },
  fewerDays: {
    id: 'course-authoring.course-schedule.field.num-days.fewer',
    defaultMessage: 'Fewer days',
    description: 'Screen reader label of the button that decreases the number of days',
  },
  moreDays: {
    id: 'course-authoring.course-schedule.field.num-days.more',
    defaultMessage: 'More days',
    description: 'Screen reader label of the button that increases the number of days',
  },
  dateRange: {
    id: 'course-authoring.course-schedule.field.date-range',
    defaultMessage: '{startDate} → {endDate}',
    description: 'Date range of a section that spans several days',
  },
  datePlaceholder: {
    id: 'course-authoring.course-schedule.field.date.placeholder',
    defaultMessage: 'Choose a date',
    description: 'Placeholder of the start date picker',
  },
  datePlaceholderShort: {
    id: 'course-authoring.course-schedule.field.date.placeholder-short',
    defaultMessage: 'Add date',
    description: 'Placeholder of a compact date picker in the schedule table',
  },
  timePlaceholder: {
    id: 'course-authoring.course-schedule.field.time.placeholder',
    defaultMessage: 'Add time',
    description: 'Placeholder of the start and end time pickers',
  },
  today: {
    id: 'course-authoring.course-schedule.field.date.today',
    defaultMessage: 'Today',
    description: 'Button in the date picker that jumps to today',
  },
  otherSessions: {
    id: 'course-authoring.course-schedule.field.date.other-sessions',
    defaultMessage: 'Other scheduled sections',
    description: 'Legend in the date picker for days that other sections are scheduled on',
  },
  clearTime: {
    id: 'course-authoring.course-schedule.field.time.clear',
    defaultMessage: 'Clear time',
    description: 'Screen reader label of the button that clears a time',
  },
  durationMinutes: {
    id: 'course-authoring.course-schedule.duration.minutes',
    defaultMessage: '{minutes} min',
    description: 'Session length under an hour, e.g. "45 min"',
  },
  durationHours: {
    id: 'course-authoring.course-schedule.duration.hours',
    defaultMessage: '{hours} hr',
    description: 'Session length in whole hours, e.g. "2 hr"',
  },
  durationNextDay: {
    id: 'course-authoring.course-schedule.duration.next-day',
    defaultMessage: '{duration}, ends next day',
    description: 'Length of a session that runs past midnight, e.g. "2 hr 30 min, ends next day"',
  },
  durationHoursMinutes: {
    id: 'course-authoring.course-schedule.duration.hours-minutes',
    defaultMessage: '{hours} hr {minutes} min',
    description: 'Session length, e.g. "1 hr 30 min"',
  },
  timezoneShortHelp: {
    id: 'course-authoring.course-schedule.field.timezone-short-help',
    defaultMessage: 'Learners see the same times.',
    description: 'Shown next to the course timezone in the schedule form',
  },
  addNotes: {
    id: 'course-authoring.course-schedule.field.add-notes',
    defaultMessage: 'Add notes',
    description: 'Link that reveals the notes field in the schedule form',
  },
  previewTitle: {
    id: 'course-authoring.course-schedule.preview.title',
    defaultMessage: 'Learner preview',
    description: 'Heading above the live preview of how the session looks on the learner Dates page',
  },
  previewEmpty: {
    id: 'course-authoring.course-schedule.preview.empty',
    defaultMessage: 'Choose a start date to see how this session will look.',
    description: 'Shown in place of the learner preview until the form has a valid date',
  },
  previewInstructor: {
    id: 'course-authoring.course-schedule.preview.instructor',
    defaultMessage: 'Instructor: {instructor}',
    description: 'Instructor line of the learner preview',
  },
  previewTools: {
    id: 'course-authoring.course-schedule.preview.tools',
    defaultMessage: 'Tools required: {tools}',
    description: 'Tools line of the learner preview',
  },
  saveScheduleButton: {
    id: 'course-authoring.course-schedule.button.save-schedule',
    defaultMessage: 'Save schedule',
    description: 'Button that saves the section schedule form',
  },
  removeShort: {
    id: 'course-authoring.course-schedule.button.remove-short',
    defaultMessage: 'Remove',
    description: 'Visible text of the button that unschedules a section',
  },
  modalTitle: {
    id: 'course-authoring.course-schedule.modal.title',
    defaultMessage: 'Schedule: {displayName}',
    description: 'Title of the per-section schedule form',
  },
  startDateLabel: {
    id: 'course-authoring.course-schedule.field.start-date',
    defaultMessage: 'Start date',
    description: 'Label of the date a section is taught',
  },
  numDaysLabel: {
    id: 'course-authoring.course-schedule.field.num-days',
    defaultMessage: 'Number of days',
    description: 'Label of how many days a section spans',
  },
  startTimeLabel: {
    id: 'course-authoring.course-schedule.field.start-time',
    defaultMessage: 'Start time',
    description: 'Label of the time a section session starts',
  },
  endTimeLabel: {
    id: 'course-authoring.course-schedule.field.end-time',
    defaultMessage: 'End time',
    description: 'Label of the time a section session ends',
  },
  instructorLabel: {
    id: 'course-authoring.course-schedule.field.instructor',
    defaultMessage: 'Instructor',
    description: 'Label of who teaches a section',
  },
  instructorPlaceholder: {
    id: 'course-authoring.course-schedule.field.instructor.placeholder',
    defaultMessage: 'Geshe Tenzin',
    description: 'Example instructor name',
  },
  toolsLabel: {
    id: 'course-authoring.course-schedule.field.tools',
    defaultMessage: 'Tools required',
    description: 'Label of what learners need for a section',
  },
  toolsPlaceholder: {
    id: 'course-authoring.course-schedule.field.tools.placeholder',
    defaultMessage: 'Zoom link, workbook pages 12–20',
    description: 'Example of tools required for a section',
  },
  notesLabel: {
    id: 'course-authoring.course-schedule.field.notes',
    defaultMessage: 'Notes',
    description: 'Label of free-text notes about a section session',
  },
  autofillTitle: {
    id: 'course-authoring.course-schedule.autofill.title',
    defaultMessage: 'Schedule the remaining sections',
    description: 'Title of the switch shown when the first section is scheduled',
  },
  autofillDescription: {
    id: 'course-authoring.course-schedule.autofill.description',
    defaultMessage: '{count, plural, one {# section} other {# sections}} back to back, {firstDate} → {lastDate}. Only the time is copied.',
    description: 'What scheduling the remaining sections will do',
  },
  shiftTitle: {
    id: 'course-authoring.course-schedule.shift.title',
    defaultMessage: 'Move later sections too',
    description: 'Title of the switch that moves later sections by the same number of days',
  },
  shiftDescription: {
    id: 'course-authoring.course-schedule.shift.description',
    defaultMessage: '{count, plural, one {The section} other {The # sections}} after this one move by {delta} {days, plural, one {day} other {days}}. {firstName} → {firstDate}.',
    description: 'What moving later sections will do, e.g. "The 28 sections after this one move by +7 days. Day 2 → Wed, Oct 21."',
  },
  removeButton: {
    id: 'course-authoring.course-schedule.button.remove',
    defaultMessage: 'Remove schedule',
    description: 'Button that unschedules a section',
  },
  cancelButton: {
    id: 'course-authoring.course-schedule.button.cancel',
    defaultMessage: 'Cancel',
    description: 'Button that closes a schedule form without saving',
  },
  saveButton: {
    id: 'course-authoring.course-schedule.button.save',
    defaultMessage: 'Save',
    description: 'Button that saves a schedule form',
  },
  warningsTitle: {
    id: 'course-authoring.course-schedule.warnings.title',
    defaultMessage: 'Check these before learners see the schedule',
    description: 'Heading above schedule warnings. Warnings never block saving.',
  },
  loading: {
    id: 'course-authoring.course-schedule.loading',
    defaultMessage: 'Loading schedule…',
    description: 'Shown while the course schedule loads',
  },

  sectionMissing: {
    id: 'course-authoring.course-schedule.error.section-missing',
    defaultMessage: 'This section is no longer in the course. Close this window and reload the outline.',
    description: 'Shown in the section schedule form when the section was deleted after the outline loaded',
  },
  loadError: {
    id: 'course-authoring.course-schedule.error.load',
    defaultMessage: "Couldn't load the schedule.",
    description: 'Shown in the schedule editors when loading the schedule fails',
  },
  retry: {
    id: 'course-authoring.course-schedule.error.retry',
    defaultMessage: 'Try again',
    description: 'Button that retries loading the schedule',
  },

  // Validation
  errorStartDateRequired: {
    id: 'course-authoring.course-schedule.error.start-date-required',
    defaultMessage: 'Choose a start date.',
    description: 'Validation error when no start date is set',
  },
  errorNumDays: {
    id: 'course-authoring.course-schedule.error.num-days',
    defaultMessage: 'Enter a number of days from 1 to 365.',
    description: 'Validation error for the number of days',
  },
  errorEndTimeNeedsStart: {
    id: 'course-authoring.course-schedule.error.end-time-needs-start',
    defaultMessage: 'Set a start time before an end time.',
    description: 'Validation error when only an end time is set',
  },
  errorSameTimes: {
    id: 'course-authoring.course-schedule.error.same-times',
    defaultMessage: "End time can't be the same as the start time.",
    description: 'Validation error when start and end time are equal (an earlier end time means the next day)',
  },
  saveError: {
    id: 'course-authoring.course-schedule.error.save',
    defaultMessage: "Couldn't save the schedule. Try again.",
    description: 'Shown when saving the schedule fails',
  },

  // Toasts
  savedToast: {
    id: 'course-authoring.course-schedule.toast.saved',
    defaultMessage: '{count, plural, one {Schedule saved} other {Schedule saved for # sections}}',
    description: 'Toast after saving a schedule',
  },
  removedToast: {
    id: 'course-authoring.course-schedule.toast.removed',
    defaultMessage: 'Schedule removed',
    description: 'Toast after unscheduling a section',
  },

  // Warnings (computed by the server, never block saving)
  warningOverlap: {
    id: 'course-authoring.course-schedule.warning.overlap',
    defaultMessage: 'Overlaps with {displayName}',
    description: 'Warning: two sections are scheduled at the same time',
  },
  warningBeforeCourseStart: {
    id: 'course-authoring.course-schedule.warning.before-course-start',
    defaultMessage: 'Before the course starts ({date})',
    description: 'Warning: a session is scheduled before the course start date',
  },
  warningAfterCourseEnd: {
    id: 'course-authoring.course-schedule.warning.after-course-end',
    defaultMessage: 'After the course ends ({date})',
    description: 'Warning: a session is scheduled after the course end date',
  },
  warningBeforeRelease: {
    id: 'course-authoring.course-schedule.warning.before-release',
    defaultMessage: "Before this section's content is released ({date}). Learners will see “Content available from {date}”.",
    description: 'Warning: a session is scheduled before the section release date',
  },
  warningDueBeforeSession: {
    id: 'course-authoring.course-schedule.warning.due-before-session',
    defaultMessage: '{displayName} is due before this session ({date})',
    description: 'Warning: a subsection in the section is due before the session',
  },

  // Status bar
  statusTitle: {
    id: 'course-authoring.course-schedule.status.title',
    defaultMessage: 'Course schedule',
    description: 'Title of the course schedule item in the outline status bar',
  },
  statusCount: {
    id: 'course-authoring.course-schedule.status.count',
    defaultMessage: '{scheduled}/{total} scheduled',
    description: 'How many sections are scheduled, e.g. "18/30 scheduled"',
  },
  statusNone: {
    id: 'course-authoring.course-schedule.status.none',
    defaultMessage: 'Set up schedule',
    description: 'Status bar link when no section is scheduled yet',
  },
  statusAll: {
    id: 'course-authoring.course-schedule.status.all',
    defaultMessage: 'All {total} scheduled',
    description: 'Status bar link when every section is scheduled',
  },
  statusEdit: {
    id: 'course-authoring.course-schedule.status.edit',
    defaultMessage: 'Edit schedule',
    description: 'Link that opens the full course schedule editor',
  },
  statusSelfPaced: {
    id: 'course-authoring.course-schedule.status.self-paced',
    defaultMessage: 'Available for instructor-paced courses',
    description: 'Shown instead of the schedule for self-paced courses',
  },

  // Full schedule editor
  bulkTitle: {
    id: 'course-authoring.course-schedule.bulk.title',
    defaultMessage: 'Course schedule',
    description: 'Title of the full course schedule editor',
  },
  bulkTimezoneLabel: {
    id: 'course-authoring.course-schedule.bulk.timezone',
    defaultMessage: 'Course timezone',
    description: 'Label of the course timezone select',
  },
  bulkFillToggle: {
    id: 'course-authoring.course-schedule.bulk.fill-toggle',
    defaultMessage: 'Fill all sections…',
    description: 'Button that opens the quick fill panel in the full schedule editor',
  },
  bulkFillStartOn: {
    id: 'course-authoring.course-schedule.bulk.fill-start-on',
    defaultMessage: 'Start on',
    description: 'Quick fill: "Start on [date] at [time] – [time]"',
  },
  bulkFillAt: {
    id: 'course-authoring.course-schedule.bulk.fill-at',
    defaultMessage: 'at',
    description: 'Quick fill: "Start on [date] at [time] – [time]"',
  },
  startPlaceholder: {
    id: 'course-authoring.course-schedule.field.start-placeholder',
    defaultMessage: 'Start',
    description: 'Short placeholder of a start time field in the schedule table',
  },
  endPlaceholder: {
    id: 'course-authoring.course-schedule.field.end-placeholder',
    defaultMessage: 'End',
    description: 'Short placeholder of an end time field in the schedule table',
  },
  bulkHeading: {
    id: 'course-authoring.course-schedule.bulk.heading',
    defaultMessage: 'All sections',
    description: 'Title of the full course schedule editor, under the "Course schedule" label',
  },
  bulkSummary: {
    id: 'course-authoring.course-schedule.bulk.summary',
    defaultMessage: '{scheduled} of {total} sections scheduled',
    description: 'Summary under the full schedule editor title',
  },
  bulkQuickFill: {
    id: 'course-authoring.course-schedule.bulk.quick-fill',
    defaultMessage: 'Quick fill',
    description: 'Label of the controls that schedule every section at once',
  },
  bulkColumnActions: {
    id: 'course-authoring.course-schedule.bulk.column.actions',
    defaultMessage: 'Actions',
    description: 'Screen reader header of the row actions column',
  },
  bulkUnsavedCount: {
    id: 'course-authoring.course-schedule.bulk.unsaved-count',
    defaultMessage: '{count, plural, =0 {No unsaved changes} one {# unsaved change} other {# unsaved changes}}',
    description: 'Footer of the full schedule editor; edits are kept locally until saved',
  },
  bulkAutofillButton: {
    id: 'course-authoring.course-schedule.bulk.autofill.button',
    defaultMessage: 'Apply to all sections',
    description: 'Button that schedules all sections back to back from a start date',
  },
  bulkAutofillHelp: {
    id: 'course-authoring.course-schedule.bulk.autofill.help',
    defaultMessage: "Sections are scheduled back to back, each keeping its number of days. Only the time is copied; instructors aren't changed.",
    description: 'Help text of the auto-fill controls',
  },
  bulkShiftLabel: {
    id: 'course-authoring.course-schedule.bulk.shift',
    defaultMessage: 'Move later sections too',
    description: 'Switch in the full schedule editor: when a date or length changes, also move the sections after it. On by default.',
  },
  bulkColumnSection: {
    id: 'course-authoring.course-schedule.bulk.column.section',
    defaultMessage: 'Section',
    description: 'Column header in the full schedule editor',
  },
  bulkColumnDays: {
    id: 'course-authoring.course-schedule.bulk.column.days',
    defaultMessage: 'Days',
    description: 'Column header for the number of days in the full schedule editor',
  },
  bulkClearRow: {
    id: 'course-authoring.course-schedule.bulk.clear-row',
    defaultMessage: 'Clear the schedule of {displayName}',
    description: 'Screen reader label of the button that unschedules one row',
  },
  bulkWarnings: {
    id: 'course-authoring.course-schedule.bulk.warnings',
    defaultMessage: 'Warnings for {displayName}',
    description: 'Screen reader label of the warning icon of one row',
  },
  bulkNoSections: {
    id: 'course-authoring.course-schedule.bulk.no-sections',
    defaultMessage: 'Add sections to the course outline to schedule them.',
    description: 'Shown in the full schedule editor when the course has no sections',
  },
});

export default messages;
