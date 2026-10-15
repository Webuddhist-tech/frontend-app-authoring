/* eslint-disable no-param-reassign */
import { createSlice } from '@reduxjs/toolkit';

import { RequestStatus } from '../../data/constants';

const slice = createSlice({
  name: 'generic',
  initialState: {
    loadingStatuses: {
      organizationLoadingStatus: RequestStatus.IN_PROGRESS,
      courseRerunLoadingStatus: RequestStatus.IN_PROGRESS,
    },
    savingStatus: '',
    organizations: [],
    organizationDisplayNames: {},
    createOrRerunCourse: {
      courseData: {},
      courseRerunData: {},
      redirectUrlObj: {},
      postErrors: {},
    },
  },
  reducers: {
    fetchOrganizations: (state, { payload }) => {
      state.organizations = payload;
    },
    fetchOrganizationDisplayNames: (state, { payload }) => {
      state.organizationDisplayNames = payload;
    },
    updateLoadingStatuses: (state, { payload }) => {
      state.loadingStatuses = { ...state.loadingStatuses, ...payload };
    },
    updateSavingStatus: (state, { payload }) => {
      state.savingStatus = payload.status;
    },
    updateCourseData: (state, { payload }) => {
      state.createOrRerunCourse.courseData = payload;
    },
    updateCourseRerunData: (state, { payload }) => {
      state.createOrRerunCourse.courseRerunData = payload;
    },
    updateRedirectUrlObj: (state, { payload }) => {
      state.createOrRerunCourse.redirectUrlObj = payload;
    },
    updatePostErrors: (state, { payload }) => {
      state.createOrRerunCourse.postErrors = payload;
    },
  },
});

export const {
  fetchOrganizations,
  fetchOrganizationDisplayNames,
  updatePostErrors,
  updateCourseRerunData,
  updateLoadingStatuses,
  updateSavingStatus,
  updateCourseData,
  updateRedirectUrlObj,
} = slice.actions;

export const {
  reducer,
} = slice;
