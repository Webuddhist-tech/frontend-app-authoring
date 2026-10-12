import { useIntl } from '@edx/frontend-platform/i18n';
import { useToggle } from '@openedx/paragon';

import StatusBarItem from '../course-outline/status-bar/StatusBarItem';
import { useCourseSchedule, useRefreshScheduleOnOutlineChange } from './data/apiHooks';
import messages from './messages';
import CourseScheduleModal from './CourseScheduleModal';

interface Props {
  courseId: string;
  isSelfPaced: boolean;
}

/**
 * "Course schedule: 18/30 scheduled" in the outline status bar, as one link
 * like the Checklists item beside it. Opens the full schedule editor.
 */
const CourseScheduleStatusItem = ({ courseId, isSelfPaced }: Props) => {
  const intl = useIntl();
  const [isOpen, open, close] = useToggle(false);
  const { data } = useCourseSchedule(courseId);
  useRefreshScheduleOnOutlineChange(courseId);

  if (!data?.enabled) {
    return null;
  }

  const statusLabel = () => {
    if (!data.scheduledCount) {
      return intl.formatMessage(messages.statusNone);
    }
    if (data.scheduledCount >= data.totalCount) {
      return intl.formatMessage(messages.statusAll, { total: data.totalCount });
    }
    return intl.formatMessage(messages.statusCount, { scheduled: data.scheduledCount, total: data.totalCount });
  };

  return (
    <StatusBarItem title={intl.formatMessage(messages.statusTitle)}>
      {isSelfPaced || data.selfPaced ? (
        <span className="small text-muted">{intl.formatMessage(messages.statusSelfPaced)}</span>
      ) : (
        <>
          {/* A plain button styled like the Checklists link next to it; the brand's
              !important .btn-link styles would make it a bold brown button instead. */}
          <button
            type="button"
            className="course-schedule-status__link small"
            title={intl.formatMessage(messages.statusEdit)}
            onClick={open}
          >
            {statusLabel()}
          </button>
          <CourseScheduleModal courseId={courseId} isOpen={isOpen} onClose={close} />
        </>
      )}
    </StatusBarItem>
  );
};

export default CourseScheduleStatusItem;
