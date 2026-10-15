import { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import { useIntl } from '@edx/frontend-platform/i18n';
import { Form, Icon } from '@openedx/paragon';
import { AccessTime, Calendar } from '@openedx/paragon/icons';

import messages from './messages';
import {
  isoToLocalDate, localDateToIso, localDateToTime, timeToLocalDate,
} from './utils';

/*
 * Branded date and time pickers for the schedule form, built on
 * react-datepicker (already a Studio dependency; its base CSS is loaded in
 * src/index.jsx). The brand restyles them in paragon/_authoring.scss.
 *
 * Values stay plain wall-clock strings ("2026-10-12", "19:00"). Typing works
 * too: the first format is how a value is shown, the others are also accepted.
 */

// Fixed positioning lets the popup escape the modal body's overflow clipping.
const POPPER_PROPS = { strategy: 'fixed' };
const DATE_FORMATS = ['EEE, d MMM yyyy', 'yyyy-MM-dd', 'd/M/yyyy', 'd MMM yyyy'];
// Compact cells leave out the year; parsing still accepts the full formats.
const COMPACT_DATE_FORMATS = ['EEE, d MMM', ...DATE_FORMATS];
const TIME_FORMATS = ['h:mm aa', 'HH:mm', 'h:mmaa', 'h aa'];

// react-datepicker needs its custom input to forward a ref.
const PickerInput = forwardRef<HTMLInputElement, any>((props, ref) => <Form.Control ref={ref} {...props} />);

interface DatePickerProps {
  id?: string;
  /** Accessible name when there's no visible <label for={id}>, e.g. in a table cell. */
  ariaLabel?: string;
  /** "sm" for compact table cells. */
  size?: 'sm';
  value: string;
  onChange: (value: string) => void;
  /** ISO dates other sections are scheduled on, marked in the calendar. */
  highlightDays?: string[];
  isInvalid?: boolean;
}

export const ScheduleDatePicker = ({
  id, ariaLabel, size, value, onChange, highlightDays = [], isInvalid = false,
}: DatePickerProps) => {
  const intl = useIntl();
  return (
    <DatePicker
      id={id}
      selected={value ? isoToLocalDate(value) : null}
      onChange={(date: Date | null) => onChange(date ? localDateToIso(date) : '')}
      dateFormat={size ? COMPACT_DATE_FORMATS : DATE_FORMATS}
      placeholderText={intl.formatMessage(size ? messages.datePlaceholderShort : messages.datePlaceholder)}
      highlightDates={highlightDays.map(isoToLocalDate)}
      todayButton={intl.formatMessage(messages.today)}
      wrapperClassName="course-schedule-picker"
      calendarClassName="course-schedule-calendar"
      popperClassName="course-schedule-popper"
      popperPlacement="bottom-start"
      popperProps={POPPER_PROPS}
      showPopperArrow={false}
      autoComplete="off"
      customInput={(
        <PickerInput
          aria-label={ariaLabel}
          size={size}
          isInvalid={isInvalid}
          trailingElement={<Icon src={Calendar} size={size ? 'xs' : 'sm'} className="course-schedule-picker__icon" />}
        />
      )}
    >
      {highlightDays.length > 0 && (
        <div className="course-schedule-calendar__legend">
          <span className="course-schedule-calendar__legend-dot" aria-hidden="true" />
          {intl.formatMessage(messages.otherSessions)}
        </div>
      )}
    </DatePicker>
  );
};

interface TimePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  ariaLabel: string;
  /** Where the list opens when empty ("HH:MM"). */
  openAt?: string;
  /** "sm" for compact table cells: no clock icon, so the time itself fits. */
  size?: 'sm';
  placeholder?: string;
  isInvalid?: boolean;
}

export const ScheduleTimePicker = ({
  value, onChange, ariaLabel, openAt = '09:00', size, placeholder, isInvalid = false,
}: TimePickerProps) => {
  const intl = useIntl();
  return (
    <DatePicker
      selected={value ? timeToLocalDate(value) : null}
      openToDate={timeToLocalDate(value || openAt)}
      onChange={(date: Date | null) => onChange(date ? localDateToTime(date) : null)}
      showTimeSelect
      showTimeSelectOnly
      timeIntervals={15}
      timeCaption={intl.formatMessage(messages.timeLabel)}
      dateFormat={TIME_FORMATS}
      placeholderText={placeholder ?? intl.formatMessage(messages.timePlaceholder)}
      isClearable={!!value}
      clearButtonTitle={intl.formatMessage(messages.clearTime)}
      wrapperClassName="course-schedule-picker"
      calendarClassName="course-schedule-calendar course-schedule-calendar--time"
      popperClassName="course-schedule-popper"
      popperPlacement="bottom-start"
      popperProps={POPPER_PROPS}
      showPopperArrow={false}
      autoComplete="off"
      customInput={(
        <PickerInput
          aria-label={ariaLabel}
          size={size}
          isInvalid={isInvalid}
          leadingElement={size ? undefined : <Icon src={AccessTime} size="sm" className="course-schedule-picker__icon" />}
        />
      )}
    />
  );
};
