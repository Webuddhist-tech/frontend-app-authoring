import { RequestStatus } from '../../data/constants';
import {
  fetchOrganizations,
  fetchOrganizationDisplayNames,
  updatePostErrors,
  updateLoadingStatuses,
  updateRedirectUrlObj,
  updateCourseRerunData,
  updateSavingStatus,
} from './slice';
import {
  createOrRerunCourse,
  getOrganizations,
  getOrganizationDisplayNames,
  getCourseRerun,
} from './api';

export function fetchOrganizationsQuery() {
  return async (dispatch) => {
    try {
      const organizations = await getOrganizations();
      dispatch(fetchOrganizations(organizations));
      dispatch(updateLoadingStatuses({ organizationLoadingStatus: RequestStatus.SUCCESSFUL }));
    } catch (error) {
      dispatch(updateLoadingStatuses({ organizationLoadingStatus: RequestStatus.FAILED }));
    }
  };
}

export function fetchOrganizationDisplayNamesQuery() {
  return async (dispatch) => {
    try {
      const organizationDisplayNames = await getOrganizationDisplayNames();
      dispatch(fetchOrganizationDisplayNames(organizationDisplayNames));
    } catch (error) {
      // Full names are presentation-only. The selector safely falls back to the identifier.
    }
  };
}

export function fetchCourseRerunQuery(courseId) {
  return async (dispatch) => {
    try {
      const courseRerun = await getCourseRerun(courseId);
      dispatch(updateCourseRerunData(courseRerun));
      dispatch(updateLoadingStatuses({ courseRerunLoadingStatus: RequestStatus.SUCCESSFUL }));
    } catch (error) {
      dispatch(updateLoadingStatuses({ courseRerunLoadingStatus: RequestStatus.FAILED }));
    }
  };
}

export function updateCreateOrRerunCourseQuery(courseData) {
  return async (dispatch) => {
    dispatch(updateSavingStatus({ status: RequestStatus.PENDING }));

    try {
      const response = await createOrRerunCourse(courseData);
      dispatch(updateRedirectUrlObj('url' in response ? response : {}));
      dispatch(updatePostErrors('errMsg' in response ? response : {}));
      dispatch(updateSavingStatus({ status: RequestStatus.SUCCESSFUL }));
      return true;
    } catch (error) {
      dispatch(updateSavingStatus({ status: RequestStatus.FAILED }));
      return false;
    }
  };
}
