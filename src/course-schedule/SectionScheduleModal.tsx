import {
  useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { useIntl } from '@edx/frontend-platform/i18n';
import {
  ActionRow, Alert, Button, Form, Icon, ModalDialog, Spinner,
} from '@openedx/paragon';
import {
  Add, Calendar, Delete, EventRepeat, Language, Person, Remove, Visibility,
} from '@openedx/paragon/icons';
import classNames from 'classnames';

import { ToastContext } from '@src/generic/toast-context';
import { useCourseSchedule, useSaveCourseSchedule } from './data/apiHooks';
import type { ScheduleInput } from './data/types';
import messages from './messages';
import { ScheduleDatePicker, ScheduleTimePicker } from './pickers';
import ScheduleWarnings from './ScheduleWarnings';
import {
  addDays, autofill, daysOf, endDateOf, formatClock, formatDay, formatDuration, formatFullDay, getErrorMessage,
  MAX_NUM_DAYS, shiftDelta, shiftLater, toInput, validateInput,
} from './utils';

interface Props {
  courseId: string;
  sectionId: string;
  displayName: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Schedule one section: date(s), times, instructor, tools and notes, with a
 * live preview of what learners will see on the Dates page.
 *
 * When this is the first section scheduled, offers to schedule the rest back to
 * back. When an already scheduled section moves or changes length, offers to
 * move the sections after it by the same number of days. Both are checked by
 * default and previewed before saving.
 */
const SectionScheduleEditor = ({
  courseId, sectionId, displayName, isOpen, onClose,
}: Props) => {
  const intl = useIntl();
  const { showToast } = useContext(ToastContext);
  const {
    data, isError, isFetching, refetch,
  } = useCourseSchedule(courseId, { freshOnMount: true });
  const saveMutation = useSaveCourseSchedule(courseId);

  const sections = data?.sections ?? [];
  const index = sections.findIndex((section) => section.sectionId === sectionId);
  const current = index === -1 ? undefined : sections[index];

  // Mounted only while open, so everything starts fresh and, with the schedule
  // already cached (the section badge loaded it), the form is filled on the
  // first render - no spinner, no flash of the previous section's values.
  const [input, setInput] = useState<ScheduleInput | null>(() => (current ? toInput(current) : null));
  const [applyToOthers, setApplyToOthers] = useState(true);
  const [showErrors, setShowErrors] = useState(false);
  const [showNotes, setShowNotes] = useState(!!current?.schedule?.notes);
  // Once the user changes anything, a background refresh must not overwrite their edits.
  const hasEdited = useRef(false);

  // The first fetch (no cache yet) or the refresh on open brought new data.
  useEffect(() => {
    if (current && !hasEdited.current) {
      const initial = toInput(current);
      setInput(initial);
      setShowNotes((previous) => previous || !!initial.notes);
    }
  }, [current]);

  const errors = input ? validateInput(intl, input) : {};
  const isValid = Object.keys(errors).length === 0;

  // Days other sections are scheduled on, marked in the date picker to help avoid clashes.
  const otherSessionDays = sections
    .filter((section) => section.schedule && section.sectionId !== sectionId)
    .flatMap((section) => daysOf(section.schedule!.startDate, section.schedule!.numDays));
  const duration = input ? formatDuration(intl, input.startTime, input.endTime) : null;

  // The course timezone's short name ("IST"), from any saved session; the server computes it.
  const timezoneAbbr = sections.find((section) => section.schedule)?.schedule?.timezoneAbbr;

  // The extra sections this save will also change, depending on the case.
  const others = useMemo((): { kind: 'autofill' | 'shift'; inputs: ScheduleInput[]; delta?: number } | null => {
    if (!input || !current || !isValid) {
      return null;
    }
    const isFirstScheduled = sections.every((section) => !section.schedule || section.sectionId === sectionId);
    if (isFirstScheduled) {
      const remaining = sections.slice(index + 1);
      if (!remaining.length) {
        return null;
      }
      const nextFreeDay = addDays(input.startDate, input.numDays);
      return { kind: 'autofill', inputs: autofill(remaining.map(toInput), nextFreeDay, input.startTime, input.endTime) };
    }
    if (current.schedule) {
      const delta = shiftDelta(current.schedule, input);
      const inputs = shiftLater(sections.map(toInput), sectionId, delta);
      return inputs.length ? { kind: 'shift', inputs, delta } : null;
    }
    return null;
  }, [input, current, sections, isValid]);

  const handleChange = (field: keyof ScheduleInput, value: string) => {
    hasEdited.current = true;
    setInput((previous) => {
      if (!previous) {
        return previous;
      }
      if (field === 'numDays') {
        return { ...previous, numDays: parseInt(value, 10) };
      }
      if (field === 'startTime' || field === 'endTime') {
        return { ...previous, [field]: value || null };
      }
      return { ...previous, [field]: value };
    });
  };

  const stepDays = (step: number) => {
    hasEdited.current = true;
    setInput((previous) => {
      if (!previous) {
        return previous;
      }
      const days = Number.isNaN(previous.numDays) ? 1 : previous.numDays;
      return { ...previous, numDays: Math.min(MAX_NUM_DAYS, Math.max(1, days + step)) };
    });
  };

  const handleSave = () => {
    if (!input || !isValid) {
      setShowErrors(true);
      return;
    }
    const upsert = [input, ...(applyToOthers && others ? others.inputs : [])];
    saveMutation.mutate({ upsert }, {
      onSuccess: () => {
        showToast(intl.formatMessage(messages.savedToast, { count: upsert.length }));
        onClose();
      },
    });
  };

  const handleRemove = () => {
    saveMutation.mutate({ remove: [sectionId] }, {
      onSuccess: () => {
        showToast(intl.formatMessage(messages.removedToast));
        onClose();
      },
    });
  };

  const fieldError = (field: keyof typeof errors) => (showErrors && errors[field] ? (
    <Form.Control.Feedback type="invalid">{errors[field]}</Form.Control.Feedback>
  ) : null);

  const renderHeader = () => {
    const releaseDate = current?.releaseDate
      ? intl.formatDate(new Date(current.releaseDate), {
        day: 'numeric', month: 'short', year: 'numeric', timeZone: data?.timezone,
      })
      : null;
    return (
      <ModalDialog.Header className="course-schedule-modal__header">
        <p className="course-schedule-modal__eyebrow">{intl.formatMessage(messages.modalEyebrow)}</p>
        <ModalDialog.Title className="course-schedule-modal__title">{displayName}</ModalDialog.Title>
        {current && (
          <p className="course-schedule-modal__subtitle">
            {intl.formatMessage(messages.modalSectionNumber, { number: index + 1, total: sections.length })}
            {releaseDate && ` · ${intl.formatMessage(messages.modalReleased, { date: releaseDate })}`}
          </p>
        )}
      </ModalDialog.Header>
    );
  };

  const renderWhen = (values: ScheduleInput) => (
    <fieldset className="course-schedule-modal__group">
      <legend className="course-schedule-modal__group-title">
        <Icon src={Calendar} size="xs" className="course-schedule-modal__group-icon" />
        {intl.formatMessage(messages.whenTitle)}
      </legend>
      <div className="course-schedule-modal__row">
        <Form.Group isInvalid={showErrors && !!errors.startDate} className="m-0">
          <Form.Label htmlFor="course-schedule-start-date">{intl.formatMessage(messages.startDateLabel)}</Form.Label>
          <ScheduleDatePicker
            id="course-schedule-start-date"
            value={values.startDate}
            onChange={(value) => handleChange('startDate', value)}
            highlightDays={otherSessionDays}
            isInvalid={showErrors && !!errors.startDate}
          />
          {fieldError('startDate')}
        </Form.Group>
        <Form.Group isInvalid={showErrors && !!errors.numDays} className="m-0">
          <Form.Label htmlFor="course-schedule-num-days">{intl.formatMessage(messages.numDaysLabel)}</Form.Label>
          <div className="course-schedule-modal__stepper">
            <button
              type="button"
              className="course-schedule-modal__step"
              aria-label={intl.formatMessage(messages.fewerDays)}
              onClick={() => stepDays(-1)}
              disabled={values.numDays <= 1}
            >
              <Icon src={Remove} size="xs" />
            </button>
            <Form.Control
              id="course-schedule-num-days"
              type="number"
              min={1}
              max={MAX_NUM_DAYS}
              value={Number.isNaN(values.numDays) ? '' : values.numDays}
              onChange={(e) => handleChange('numDays', e.target.value)}
            />
            <button
              type="button"
              className="course-schedule-modal__step"
              aria-label={intl.formatMessage(messages.moreDays)}
              onClick={() => stepDays(1)}
              disabled={values.numDays >= MAX_NUM_DAYS}
            >
              <Icon src={Add} size="xs" />
            </button>
          </div>
          {fieldError('numDays')}
        </Form.Group>
      </div>
      {values.startDate && values.numDays > 1 && (
        <p className="course-schedule-modal__date-range">
          {intl.formatMessage(messages.dateRange, {
            startDate: formatDay(intl, values.startDate),
            endDate: formatDay(intl, endDateOf(values.startDate, values.numDays)),
          })}
        </p>
      )}
      <div>
        <p className="course-schedule-modal__label" id="course-schedule-time-label">
          {intl.formatMessage(messages.timeLabel)}{' '}
          <span className="course-schedule-modal__optional">{intl.formatMessage(messages.optional)}</span>
        </p>
        <div className="course-schedule-modal__time-row" role="group" aria-labelledby="course-schedule-time-label">
          <ScheduleTimePicker
            ariaLabel={intl.formatMessage(messages.startTimeLabel)}
            value={values.startTime}
            onChange={(value) => handleChange('startTime', value ?? '')}
            openAt="09:00"
            isInvalid={showErrors && !!errors.startTime}
          />
          <span className="course-schedule-modal__dash" aria-hidden="true">–</span>
          <ScheduleTimePicker
            ariaLabel={intl.formatMessage(messages.endTimeLabel)}
            value={values.endTime}
            onChange={(value) => handleChange('endTime', value ?? '')}
            openAt={values.startTime || '10:00'}
            isInvalid={showErrors && !!errors.endTime}
          />
          {duration && <span className="course-schedule-modal__duration">{duration}</span>}
        </div>
        {showErrors && (errors.startTime || errors.endTime) && (
          <p className="course-schedule-modal__error">{errors.startTime || errors.endTime}</p>
        )}
      </div>
      <p className="course-schedule-modal__help">
        <span className="course-schedule-modal__tz">
          <Icon src={Language} size="xs" />
          {timezoneAbbr ? `${timezoneAbbr} · ${data!.timezone}` : data!.timezone}
        </span>
        {intl.formatMessage(messages.timezoneShortHelp)}
      </p>
    </fieldset>
  );

  const renderDetails = (values: ScheduleInput) => (
    <fieldset className="course-schedule-modal__group">
      <legend className="course-schedule-modal__group-title">
        <Icon src={Person} size="xs" className="course-schedule-modal__group-icon" />
        {intl.formatMessage(messages.detailsTitle)}{' '}
        <span className="course-schedule-modal__optional">{intl.formatMessage(messages.optional)}</span>
      </legend>
      <Form.Group className="m-0">
        <Form.Label>{intl.formatMessage(messages.instructorLabel)}</Form.Label>
        <Form.Control
          value={values.instructor}
          maxLength={255}
          placeholder={intl.formatMessage(messages.instructorPlaceholder)}
          onChange={(e) => handleChange('instructor', e.target.value)}
        />
      </Form.Group>
      <Form.Group className="m-0">
        <Form.Label>{intl.formatMessage(messages.toolsLabel)}</Form.Label>
        <Form.Control
          value={values.toolsRequired}
          maxLength={2000}
          placeholder={intl.formatMessage(messages.toolsPlaceholder)}
          onChange={(e) => handleChange('toolsRequired', e.target.value)}
        />
      </Form.Group>
      {showNotes ? (
        <Form.Group className="m-0">
          <Form.Label>{intl.formatMessage(messages.notesLabel)}</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            maxLength={5000}
            autoFocus={!values.notes}
            value={values.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
          />
        </Form.Group>
      ) : (
        <Button
          variant="link"
          size="sm"
          className="course-schedule-modal__add-notes"
          iconBefore={Add}
          onClick={() => setShowNotes(true)}
        >
          {intl.formatMessage(messages.addNotes)}
        </Button>
      )}
    </fieldset>
  );

  // What the learner Dates tab will show (frontend-app-learning section-schedule/SectionScheduleItem):
  // the day's heading on the timeline, then the session.
  const renderPreview = (values: ScheduleInput) => {
    const heading = (
      <p className="course-schedule-modal__section-label">
        <Icon src={Visibility} size="xs" />
        {intl.formatMessage(messages.previewTitle)}
      </p>
    );
    if (!values.startDate || !isValid) {
      return (
        <div className="course-schedule-modal__preview-block">
          {heading}
          <div className="course-schedule-modal__preview is-empty">{intl.formatMessage(messages.previewEmpty)}</div>
        </div>
      );
    }
    let time = values.startTime ? formatClock(intl, values.startTime) : '';
    if (values.startTime && values.endTime) {
      time = `${time}–${formatClock(intl, values.endTime)}`;
    }
    if (time && timezoneAbbr) {
      time = `${time} ${timezoneAbbr}`;
    }
    const range = values.numDays > 1
      ? intl.formatMessage(messages.dateRange, {
        startDate: formatDay(intl, values.startDate),
        endDate: formatDay(intl, endDateOf(values.startDate, values.numDays)),
      })
      : '';
    const when = [time, range].filter(Boolean).join(' · ');
    return (
      <div className="course-schedule-modal__preview-block">
        {heading}
        <div className="course-schedule-modal__timeline">
          <p className="course-schedule-modal__timeline-day">{formatFullDay(intl, values.startDate)}</p>
          <div className="course-schedule-modal__preview" data-testid="course-schedule-preview">
            <div className="course-schedule-modal__preview-title">{displayName}</div>
            {when && <div className="course-schedule-modal__preview-when">{when}</div>}
            {values.instructor && (
              <div>{intl.formatMessage(messages.previewInstructor, { instructor: values.instructor })}</div>
            )}
            {values.toolsRequired && (
              <div>{intl.formatMessage(messages.previewTools, { tools: values.toolsRequired })}</div>
            )}
            {values.notes && <div className="course-schedule-modal__preview-notes">{values.notes}</div>}
          </div>
        </div>
      </div>
    );
  };

  // "Move later sections too" / "Schedule the remaining sections", with a switch.
  const renderOthers = () => {
    if (!others) {
      return null;
    }
    const nameOf = (id: string) => sections.find((section) => section.sectionId === id)?.displayName ?? '';
    const first = others.inputs[0];
    const last = others.inputs[others.inputs.length - 1];
    let title;
    let description;
    if (others.kind === 'autofill') {
      title = intl.formatMessage(messages.autofillTitle);
      description = intl.formatMessage(messages.autofillDescription, {
        count: others.inputs.length,
        firstDate: formatDay(intl, first.startDate),
        lastDate: formatDay(intl, last.startDate),
      });
    } else {
      const delta = others.delta!;
      title = intl.formatMessage(messages.shiftTitle);
      description = intl.formatMessage(messages.shiftDescription, {
        count: others.inputs.length,
        delta: delta > 0 ? `+${delta}` : `−${Math.abs(delta)}`,
        days: Math.abs(delta),
        firstName: nameOf(first.sectionId),
        firstDate: formatDay(intl, first.startDate),
      });
    }
    return (
      <div className={classNames('course-schedule-modal__others', { 'is-off': !applyToOthers })}>
        <Icon src={EventRepeat} size="sm" className="course-schedule-modal__others-icon" />
        <div className="course-schedule-modal__others-text">
          <p className="course-schedule-modal__others-title" id="course-schedule-others-title">{title}</p>
          <p className="course-schedule-modal__others-description">{description}</p>
        </div>
        <Form.Switch
          className="course-schedule-modal__others-switch"
          aria-labelledby="course-schedule-others-title"
          checked={applyToOthers}
          onChange={(e) => setApplyToOthers(e.target.checked)}
        >
          <span className="sr-only">{title}</span>
        </Form.Switch>
      </div>
    );
  };

  return (
    <ModalDialog
      title={intl.formatMessage(messages.modalTitle, { displayName })}
      className="course-schedule-modal"
      size="lg"
      isOpen={isOpen}
      onClose={onClose}
      hasCloseButton
      isFullscreenOnMobile
      isOverflowVisible={false}
    >
      {renderHeader()}
      <ModalDialog.Body className="course-schedule-modal__body">
        {!input ? (
          <div className="course-schedule-modal__loading">
            {isError && (
              <Alert variant="danger">
                {intl.formatMessage(messages.loadError)}{' '}
                <Button variant="link" size="sm" onClick={() => refetch()}>{intl.formatMessage(messages.retry)}</Button>
              </Alert>
            )}
            {/* Loaded, but this section isn't in the course any more (deleted since the page loaded). */}
            {!isError && data && !isFetching && (
              <Alert variant="warning">{intl.formatMessage(messages.sectionMissing)}</Alert>
            )}
            {!isError && (!data || isFetching) && (
              <Spinner animation="border" screenReaderText={intl.formatMessage(messages.loading)} />
            )}
          </div>
        ) : (
          <>
            {saveMutation.isError && (
              <Alert variant="danger">
                {getErrorMessage(saveMutation.error, intl.formatMessage(messages.saveError))}
              </Alert>
            )}
            <ScheduleWarnings warnings={current?.warnings ?? []} />
            <div className="course-schedule-modal__layout">
              <div className="course-schedule-modal__main">
                {renderWhen(input)}
                {renderDetails(input)}
              </div>
              <div className="course-schedule-modal__side">
                {renderPreview(input)}
                {renderOthers()}
              </div>
            </div>
          </>
        )}
      </ModalDialog.Body>
      <ModalDialog.Footer className="course-schedule-modal__footer">
        <ActionRow>
          {current?.schedule && (
            <Button
              variant="link"
              size="sm"
              className="course-schedule-modal__remove"
              iconBefore={Delete}
              aria-label={intl.formatMessage(messages.removeButton)}
              onClick={handleRemove}
              disabled={saveMutation.isPending}
            >
              {intl.formatMessage(messages.removeShort)}
            </Button>
          )}
          <ActionRow.Spacer />
          <ModalDialog.CloseButton variant="tertiary">
            {intl.formatMessage(messages.cancelButton)}
          </ModalDialog.CloseButton>
          <Button onClick={handleSave} disabled={saveMutation.isPending || !input}>
            {intl.formatMessage(messages.saveScheduleButton)}
          </Button>
        </ActionRow>
      </ModalDialog.Footer>
    </ModalDialog>
  );
};

/** Mounts the form only while it is open, so each opening starts from clean state. */
const SectionScheduleModal = (props: Props) => (props.isOpen ? <SectionScheduleEditor {...props} /> : null);

export default SectionScheduleModal;
