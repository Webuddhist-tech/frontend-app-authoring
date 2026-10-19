import { RequestStatus } from '../../data/constants';

import { getHelpUrls } from './api';
import { updateLoadingHelpUrlsStatus, updatePages } from './slice';

// The backend `home` help token still resolves to a retired readthedocs page.
// Override it with the current Open edX educators quickstart until the backend
// help_tokens config is migrated to docs.openedx.org.
const HOME_HELP_URL_OVERRIDE = 'https://docs.openedx.org/en/latest/educators/quickstarts/build_a_course.html';
const CONTENT_HIGHLIGHTS_HELP_URL_OVERRIDE = 'https://docs.openedx.org/en/latest/educators/how-tos/course_development/manage_course_highlight_emails.html';

export function fetchHelpUrls() {
  return async (dispatch) => {
    dispatch(updateLoadingHelpUrlsStatus({ status: RequestStatus.IN_PROGRESS }));

    try {
      const urls = await getHelpUrls();

      dispatch(updatePages({
        ...urls,
        home: HOME_HELP_URL_OVERRIDE,
        contentHighlights: CONTENT_HIGHLIGHTS_HELP_URL_OVERRIDE,
      }));

      dispatch(updateLoadingHelpUrlsStatus({ status: RequestStatus.SUCCESSFUL }));
      return true;
    } catch (error) {
      dispatch(updateLoadingHelpUrlsStatus({ status: RequestStatus.FAILED }));

      return false;
    }
  };
}
