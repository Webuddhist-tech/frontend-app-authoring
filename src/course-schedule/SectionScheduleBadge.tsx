import { useIntl } from '@edx/frontend-platform/i18n';
import {
  Icon, OverlayTrigger, Tooltip, useToggle,
} from '@openedx/paragon';
import { Calendar, Edit, EditCalendar } from '@openedx/paragon/icons';
import classNames from 'classnames';

import { useCourseSchedule } from './data/apiHooks';
import messages from './messages';
import SectionScheduleModal from './SectionScheduleModal';
import { formatSessionSummary, formatWarning } from './utils';

interface Props {
  courseId: string;
  sectionId: string;
  displayName: string;
  isSelfPaced: boolean;
}

/**
 * The schedule chip on a section card, next to "Section highlights":
 * "Mon, Oct 12 · 7:00 PM–8:30 PM IST", or a dashed "Add schedule" chip when
 * the section has none. Hovering explains that this is when the section is
 * taught, not its release date, and lists any warnings (marked by a dot).
 * Opens the section's schedule form. Hidden for self-paced courses.
 */
const SectionScheduleBadge = ({
  courseId, sectionId, displayName, isSelfPaced,
}: Props) => {
  const intl = useIntl();
  const [isOpen, open, close] = useToggle(false);
  const { data } = useCourseSchedule(isSelfPaced ? undefined : courseId);

  if (isSelfPaced || !data?.enabled || data.selfPaced) {
    return null;
  }

  // A section added since the schedule was fetched is simply unscheduled.
  const section = data.sections.find((item) => item.sectionId === sectionId);
  const schedule = section?.schedule;
  const warnings = section?.warnings ?? [];

  const label = schedule ? formatSessionSummary(intl, schedule) : intl.formatMessage(messages.badgeSetSchedule);
  const ariaLabel = [
    intl.formatMessage(messages.badgeAriaLabel, { displayName }),
    label,
    warnings.length ? intl.formatMessage(messages.badgeWarnings, { count: warnings.length }) : null,
  ].filter(Boolean).join(', ');

  // A plain button, not Paragon's: the brand forces transparent, borderless
  // styles onto every .btn-tertiary with !important, which would flatten the chip.
  const chip = (
    <button
      type="button"
      className={classNames('course-schedule-badge', {
        'is-empty': !schedule,
        'has-warnings': warnings.length > 0,
      })}
      aria-label={ariaLabel}
      onClick={open}
    >
      <Icon src={schedule ? Calendar : EditCalendar} size="xs" className="course-schedule-badge__icon" />
      <span className="course-schedule-badge__text">{label}</span>
      {warnings.length > 0 && <span className="course-schedule-badge__dot" aria-hidden="true" />}
      {schedule && <Icon src={Edit} size="xs" className="course-schedule-badge__edit" />}
    </button>
  );

  return (
    <>
      <OverlayTrigger
        placement="top"
        overlay={(
          <Tooltip id={`course-schedule-tooltip-${sectionId}`} className="course-schedule-badge__tooltip">
            <div>{intl.formatMessage(schedule ? messages.badgeTooltip : messages.badgeTooltipEmpty)}</div>
            {warnings.length > 0 && (
              <ul className="course-schedule-badge__tooltip-warnings">
                {warnings.map((warning, position) => (
                  // Warnings have no id (overlaps carry no date), so the position is the stable part.
                  // eslint-disable-next-line react/no-array-index-key
                  <li key={`${warning.code}-${position}`}>{formatWarning(intl, warning)}</li>
                ))}
              </ul>
            )}
          </Tooltip>
        )}
      >
        {chip}
      </OverlayTrigger>
      <SectionScheduleModal
        courseId={courseId}
        sectionId={sectionId}
        displayName={displayName}
        isOpen={isOpen}
        onClose={close}
      />
    </>
  );
};

export default SectionScheduleBadge;
