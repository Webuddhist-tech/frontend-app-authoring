import { camelCaseObject, getConfig, snakeCaseObject } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';

import type { CourseSchedule, ScheduleUpdate } from './types';

export const getCourseScheduleUrl = (courseId: string) => (
  `${getConfig().STUDIO_BASE_URL}/api/course-schedule/v1/studio/${courseId}/`
);

export async function getCourseSchedule(courseId: string): Promise<CourseSchedule> {
  const { data } = await getAuthenticatedHttpClient().get(getCourseScheduleUrl(courseId));
  return camelCaseObject(data);
}

export const getTimezonesUrl = () => `${getConfig().STUDIO_BASE_URL}/api/course-schedule/v1/studio/timezones/`;

/** Every timezone name the server accepts, sorted. */
export async function getTimezones(): Promise<string[]> {
  const { data } = await getAuthenticatedHttpClient().get(getTimezonesUrl());
  return data.timezones;
}

/** Save a batch of changes; resolves to the course's whole schedule after saving. */
export async function saveCourseSchedule(courseId: string, update: ScheduleUpdate): Promise<CourseSchedule> {
  const { data } = await getAuthenticatedHttpClient().put(getCourseScheduleUrl(courseId), snakeCaseObject(update));
  return camelCaseObject(data);
}
