import { useIntl } from '@edx/frontend-platform/i18n';
import { Icon } from '@openedx/paragon';
import { Warning } from '@openedx/paragon/icons';

import type { ScheduleWarning } from './data/types';
import messages from './messages';
import { formatWarning } from './utils';

interface Props {
  warnings: ScheduleWarning[];
}

/** The server's warnings for one section. Informational: they never block saving. */
const ScheduleWarnings = ({ warnings }: Props) => {
  const intl = useIntl();
  if (!warnings.length) {
    return null;
  }
  return (
    <div className="course-schedule-warnings" role="status">
      <p className="course-schedule-warnings__title">
        <Icon src={Warning} size="sm" className="course-schedule-warnings__icon" />
        {intl.formatMessage(messages.warningsTitle)}
      </p>
      <ul className="course-schedule-warnings__list">
        {warnings.map((warning, position) => (
          // eslint-disable-next-line react/no-array-index-key
          <li key={`${warning.code}-${position}`}>{formatWarning(intl, warning)}</li>
        ))}
      </ul>
    </div>
  );
};

export default ScheduleWarnings;
