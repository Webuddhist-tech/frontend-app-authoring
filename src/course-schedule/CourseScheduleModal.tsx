import {
  useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { useIntl } from '@edx/frontend-platform/i18n';
import {
  ActionRow, Alert, Button, Form, Icon, IconButton, ModalDialog, OverlayTrigger, Spinner, Tooltip,
} from '@openedx/paragon';
import { Close, EventRepeat, Warning } from '@openedx/paragon/icons';
import classNames from 'classnames';

import { ToastContext } from '@src/generic/toast-context';
import { useCourseSchedule, useSaveCourseSchedule, useTimezones } from './data/apiHooks';
import type { ScheduleInput, ScheduleUpdate } from './data/types';
import messages from './messages';
import { ScheduleDatePicker, ScheduleTimePicker } from './pickers';
import {
  autofill, endDateOf, formatDay, formatWarning, getErrorMessage, MAX_NUM_DAYS, shiftDelta, shiftLater, toInput,
  validateInput,
} from './utils';

interface Props {
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
}

const isSameInput = (a: ScheduleInput, b: ScheduleInput) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Edit the whole course schedule at once: the course timezone, a quick fill
 * that schedules every section from a start date, and a row per section.
 * Tools and notes are edited per section, from its chip on the outline.
 *
 * Changes stay local (edited rows are marked) until Save, which sends one batch.
 */
const CourseScheduleEditor = ({ courseId, isOpen, onClose }: Props) => {
  const intl = useIntl();
  const { showToast } = useContext(ToastContext);
  const {
    data, isError, refetch,
  } = useCourseSchedule(courseId, { freshOnMount: true });
  const saveMutation = useSaveCourseSchedule(courseId);
  const { data: timezoneNames } = useTimezones();

  // Mounted only while open, so everything starts fresh and, when the schedule
  // is already cached (it is: the status bar loaded it), the rows are there on
  // the first render - no spinner, no flash of the previous contents.
  const [rows, setRows] = useState<ScheduleInput[] | null>(() => (data ? data.sections.map(toInput) : null));
  const [timezone, setTimezone] = useState(data?.timezone ?? '');
  const [shiftEnabled, setShiftEnabled] = useState(true);
  const [fill, setFill] = useState<{ startDate: string; startTime: string | null; endTime: string | null }>(
    { startDate: '', startTime: null, endTime: null },
  );
  const [showErrors, setShowErrors] = useState(false);
  // Quick fill is the natural first step for a course with no schedule yet.
  const [isFillOpen, setIsFillOpen] = useState(data ? data.scheduledCount === 0 : false);
  // Once the user changes anything, a background refresh must not overwrite their edits.
  const hasEdited = useRef(false);
  const hasLoaded = useRef(!!data);

  // The first fetch (no cache yet) or the refresh on open brought new data.
  useEffect(() => {
    if (!data) {
      return;
    }
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      setIsFillOpen(data.scheduledCount === 0);
    }
    if (!hasEdited.current) {
      setRows(data.sections.map(toInput));
      setTimezone(data.timezone);
    }
  }, [data]);

  // Rows are a snapshot taken on open; look sections up by id in case the data refetches meanwhile.
  const sectionsById = useMemo(
    () => new Map(data?.sections.map((section) => [section.sectionId, section])),
    [data],
  );
  const original = useMemo(
    () => new Map(data?.sections.map((section) => [section.sectionId, toInput(section)])),
    [data],
  );

  const rowErrors = (rows ?? []).map((row) => (row.startDate ? validateInput(intl, row) : {}));
  const hasErrors = rowErrors.some((errors) => Object.keys(errors).length > 0);
  const isEdited = (row: ScheduleInput) => {
    const before = original.get(row.sectionId);
    return !before || !isSameInput(row, before);
  };
  const unsavedCount = (rows ?? []).filter(isEdited).length + (data && timezone !== data.timezone ? 1 : 0);

  const updateRow = (sectionId: string, changes: Partial<ScheduleInput>) => {
    hasEdited.current = true;
    setRows((previous) => {
      if (!previous) {
        return previous;
      }
      const before = previous.find((row) => row.sectionId === sectionId)!;
      const after = { ...before, ...changes };
      let next = previous.map((row) => (row.sectionId === sectionId ? after : row));
      if (shiftEnabled && ('startDate' in changes || 'numDays' in changes)) {
        const moved = shiftLater(next, sectionId, shiftDelta(before, after));
        const movedById = new Map(moved.map((row) => [row.sectionId, row]));
        next = next.map((row) => movedById.get(row.sectionId) ?? row);
      }
      return next;
    });
  };

  const handleAutofill = () => {
    if (!rows || !fill.startDate) {
      return;
    }
    hasEdited.current = true;
    setRows(autofill(rows, fill.startDate, fill.startTime, fill.endTime));
    setIsFillOpen(false);
  };

  const handleSave = () => {
    if (!rows || !data) {
      return;
    }
    if (hasErrors) {
      setShowErrors(true);
      return;
    }
    const update: ScheduleUpdate = {
      upsert: rows.filter((row) => row.startDate && isEdited(row)),
      remove: rows
        .filter((row) => !row.startDate && original.get(row.sectionId)?.startDate)
        .map((row) => row.sectionId),
    };
    if (timezone !== data.timezone) {
      update.timezone = timezone;
    }
    const count = update.upsert!.length + update.remove!.length;
    if (!count && !update.timezone) {
      onClose();
      return;
    }
    saveMutation.mutate(update, {
      onSuccess: () => {
        showToast(intl.formatMessage(messages.savedToast, { count }));
        onClose();
      },
    });
  };

  const renderSummary = () => {
    if (!rows) {
      return null;
    }
    const scheduled = rows.filter((row) => row.startDate);
    const parts = [intl.formatMessage(messages.bulkSummary, { scheduled: scheduled.length, total: rows.length })];
    if (scheduled.length) {
      const first = scheduled.reduce((min, row) => (row.startDate < min ? row.startDate : min), scheduled[0].startDate);
      const last = scheduled.reduce((max, row) => {
        const end = endDateOf(row.startDate, row.numDays || 1);
        return end > max ? end : max;
      }, first);
      parts.push(intl.formatMessage(messages.dateRange, {
        startDate: formatDay(intl, first),
        endDate: formatDay(intl, last),
      }));
    }
    return <p className="course-schedule-modal__subtitle">{parts.join(' · ')}</p>;
  };

  const renderToolbar = () => (
    <div className="course-schedule-bulk__toolbar">
      <div className="course-schedule-bulk__toolbar-row">
        <Form.Group controlId="course-schedule-timezone" className="course-schedule-bulk__timezone m-0">
          <Form.Label className="course-schedule-modal__label">{intl.formatMessage(messages.bulkTimezoneLabel)}</Form.Label>
          <Form.Control
            as="select"
            size="sm"
            value={timezone}
            onChange={(e) => {
              hasEdited.current = true;
              setTimezone(e.target.value);
            }}
          >
            {/* Until the list loads, the current timezone is the only option. */}
            {(timezoneNames ?? [timezone]).map((name) => <option key={name} value={name}>{name}</option>)}
          </Form.Control>
        </Form.Group>
        <Form.Switch
          className="course-schedule-bulk__shift"
          checked={shiftEnabled}
          onChange={(e) => setShiftEnabled(e.target.checked)}
        >
          {intl.formatMessage(messages.bulkShiftLabel)}
        </Form.Switch>
        <Button
          variant="outline-primary"
          size="sm"
          className="course-schedule-bulk__fill-toggle"
          iconBefore={EventRepeat}
          aria-expanded={isFillOpen}
          onClick={() => setIsFillOpen(!isFillOpen)}
        >
          {intl.formatMessage(messages.bulkFillToggle)}
        </Button>
      </div>
      {isFillOpen && (
        <div className="course-schedule-bulk__fill">
          <div className="course-schedule-bulk__fill-row">
            <span className="course-schedule-bulk__fill-text">{intl.formatMessage(messages.bulkFillStartOn)}</span>
            <ScheduleDatePicker
              ariaLabel={intl.formatMessage(messages.startDateLabel)}
              value={fill.startDate}
              onChange={(value) => setFill({ ...fill, startDate: value })}
            />
            <span className="course-schedule-bulk__fill-text">{intl.formatMessage(messages.bulkFillAt)}</span>
            <ScheduleTimePicker
              size="sm"
              placeholder={intl.formatMessage(messages.startPlaceholder)}
              ariaLabel={intl.formatMessage(messages.startTimeLabel)}
              value={fill.startTime}
              onChange={(value) => setFill({ ...fill, startTime: value })}
            />
            <span className="course-schedule-modal__dash" aria-hidden="true">–</span>
            <ScheduleTimePicker
              size="sm"
              placeholder={intl.formatMessage(messages.endPlaceholder)}
              ariaLabel={intl.formatMessage(messages.endTimeLabel)}
              value={fill.endTime}
              onChange={(value) => setFill({ ...fill, endTime: value })}
              openAt={fill.startTime || '10:00'}
            />
            <Button size="sm" onClick={handleAutofill} disabled={!fill.startDate || !rows!.length}>
              {intl.formatMessage(messages.bulkAutofillButton)}
            </Button>
          </div>
          <p className="course-schedule-bulk__fill-help">{intl.formatMessage(messages.bulkAutofillHelp)}</p>
        </div>
      )}
    </div>
  );

  const renderWarnings = (sectionId: string, displayName: string) => {
    const warnings = sectionsById.get(sectionId)?.warnings ?? [];
    if (!warnings.length) {
      return null;
    }
    return (
      <OverlayTrigger
        placement="top"
        overlay={(
          <Tooltip id={`course-schedule-row-warnings-${sectionId}`}>
            {warnings.map((warning, position) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={`${warning.code}-${position}`}>{formatWarning(intl, warning)}</div>
            ))}
          </Tooltip>
        )}
      >
        <button
          type="button"
          className="course-schedule-table__warning"
          aria-label={intl.formatMessage(messages.bulkWarnings, { displayName })}
        >
          <Icon src={Warning} size="xs" />
        </button>
      </OverlayTrigger>
    );
  };

  const renderTable = () => (
    <table className="course-schedule-table">
      <thead>
        <tr>
          <th className="course-schedule-table__num" aria-hidden="true">#</th>
          <th>{intl.formatMessage(messages.bulkColumnSection)}</th>
          <th>{intl.formatMessage(messages.startDateLabel)}</th>
          <th>{intl.formatMessage(messages.bulkColumnDays)}</th>
          <th>{intl.formatMessage(messages.timeLabel)}</th>
          <th>{intl.formatMessage(messages.instructorLabel)}</th>
          <th><span className="sr-only">{intl.formatMessage(messages.bulkColumnActions)}</span></th>
        </tr>
      </thead>
      <tbody>
        {rows!.map((row, index) => {
          const section = sectionsById.get(row.sectionId);
          if (!section) {
            return null;
          }
          const name = section.displayName;
          const errorText = showErrors ? Object.values(rowErrors[index]).join(' ') : '';
          const isScheduled = !!row.startDate;
          return (
            <tr
              key={row.sectionId}
              className={classNames({
                'is-edited': isEdited(row),
                'is-invalid': !!errorText,
                'is-unscheduled': !isScheduled,
              })}
            >
              <td className="course-schedule-table__num">{index + 1}</td>
              <th scope="row" className="course-schedule-table__section">
                <span className="course-schedule-table__name" title={name}>{name}</span>
                {renderWarnings(row.sectionId, name)}
                {errorText && <div className="course-schedule-table__error">{errorText}</div>}
              </th>
              <td className="course-schedule-table__date">
                <ScheduleDatePicker
                  size="sm"
                  ariaLabel={`${intl.formatMessage(messages.startDateLabel)} – ${name}`}
                  value={row.startDate}
                  onChange={(value) => updateRow(row.sectionId, { startDate: value })}
                />
              </td>
              <td className="course-schedule-table__days">
                <Form.Control
                  type="number"
                  size="sm"
                  min={1}
                  max={MAX_NUM_DAYS}
                  aria-label={`${intl.formatMessage(messages.numDaysLabel)} – ${name}`}
                  value={Number.isNaN(row.numDays) ? '' : row.numDays}
                  onChange={(e) => updateRow(row.sectionId, { numDays: parseInt(e.target.value, 10) })}
                />
              </td>
              <td className="course-schedule-table__time">
                {isScheduled ? (
                  <div className="course-schedule-table__time-range">
                    <ScheduleTimePicker
                      size="sm"
                      placeholder={intl.formatMessage(messages.startPlaceholder)}
                      ariaLabel={`${intl.formatMessage(messages.startTimeLabel)} – ${name}`}
                      value={row.startTime}
                      onChange={(value) => updateRow(row.sectionId, { startTime: value })}
                    />
                    <span className="course-schedule-modal__dash" aria-hidden="true">–</span>
                    <ScheduleTimePicker
                      size="sm"
                      placeholder={intl.formatMessage(messages.endPlaceholder)}
                      ariaLabel={`${intl.formatMessage(messages.endTimeLabel)} – ${name}`}
                      value={row.endTime}
                      onChange={(value) => updateRow(row.sectionId, { endTime: value })}
                      openAt={row.startTime || '10:00'}
                    />
                  </div>
                ) : <span className="course-schedule-table__empty">—</span>}
              </td>
              <td className="course-schedule-table__instructor">
                {isScheduled ? (
                  <Form.Control
                    size="sm"
                    maxLength={255}
                    aria-label={`${intl.formatMessage(messages.instructorLabel)} – ${name}`}
                    value={row.instructor}
                    onChange={(e) => updateRow(row.sectionId, { instructor: e.target.value })}
                  />
                ) : <span className="course-schedule-table__empty">—</span>}
              </td>
              <td className="course-schedule-table__actions">
                {isScheduled && (
                  <IconButton
                    src={Close}
                    iconAs={Icon}
                    size="sm"
                    alt={intl.formatMessage(messages.bulkClearRow, { displayName: name })}
                    onClick={() => updateRow(row.sectionId, {
                      startDate: '', startTime: null, endTime: null,
                    })}
                  />
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const isReady = !!data && !!rows;

  return (
    <ModalDialog
      title={intl.formatMessage(messages.bulkTitle)}
      className="course-schedule-modal course-schedule-bulk-modal"
      size="xl"
      isOpen={isOpen}
      onClose={onClose}
      hasCloseButton
      isFullscreenOnMobile
      isOverflowVisible={false}
    >
      <ModalDialog.Header className="course-schedule-modal__header">
        <p className="course-schedule-modal__eyebrow">{intl.formatMessage(messages.bulkTitle)}</p>
        <ModalDialog.Title className="course-schedule-modal__title">
          {intl.formatMessage(messages.bulkHeading)}
        </ModalDialog.Title>
        {renderSummary()}
      </ModalDialog.Header>
      <ModalDialog.Body className="course-schedule-modal__body">
        {!isReady ? (
          <div className="course-schedule-modal__loading">
            {isError ? (
              <Alert variant="danger">
                {intl.formatMessage(messages.loadError)}{' '}
                <Button variant="link" size="sm" onClick={() => refetch()}>{intl.formatMessage(messages.retry)}</Button>
              </Alert>
            ) : <Spinner animation="border" screenReaderText={intl.formatMessage(messages.loading)} />}
          </div>
        ) : (
          <>
            {saveMutation.isError && (
              <Alert variant="danger">
                {getErrorMessage(saveMutation.error, intl.formatMessage(messages.saveError))}
              </Alert>
            )}
            {renderToolbar()}
            {rows.length ? (
              <div className="course-schedule-table__wrapper">{renderTable()}</div>
            ) : (
              <p>{intl.formatMessage(messages.bulkNoSections)}</p>
            )}
          </>
        )}
      </ModalDialog.Body>
      <ModalDialog.Footer className="course-schedule-modal__footer">
        <ActionRow>
          <span className={classNames('course-schedule-bulk-modal__hint', { 'has-changes': unsavedCount > 0 })}>
            {intl.formatMessage(messages.bulkUnsavedCount, { count: unsavedCount })}
          </span>
          <ActionRow.Spacer />
          <ModalDialog.CloseButton variant="tertiary">
            {intl.formatMessage(messages.cancelButton)}
          </ModalDialog.CloseButton>
          <Button onClick={handleSave} disabled={saveMutation.isPending || !isReady}>
            {intl.formatMessage(messages.saveScheduleButton)}
          </Button>
        </ActionRow>
      </ModalDialog.Footer>
    </ModalDialog>
  );
};

/** Mounts the editor only while it is open, so each opening starts from clean state. */
const CourseScheduleModal = (props: Props) => (props.isOpen ? <CourseScheduleEditor {...props} /> : null);

export default CourseScheduleModal;
