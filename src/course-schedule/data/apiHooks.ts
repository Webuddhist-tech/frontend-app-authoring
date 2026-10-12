import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getSectionsList } from '@src/course-outline/data/selectors';

import { getCourseSchedule, getTimezones, saveCourseSchedule } from './api';
import type { ScheduleUpdate } from './types';

const SCHEDULE_STALE_MS = 60_000;

export const courseScheduleQueryKeys = {
  all: ['courseSchedule'],
  course: (courseId?: string) => [...courseScheduleQueryKeys.all, courseId],
  timezones: ['courseScheduleTimezones'],
};

/**
 * The course's whole schedule. One request is shared by every section badge
 * and the status bar item. Editors pass `freshOnMount` to refetch when they open.
 */
export const useCourseSchedule = (courseId?: string, { freshOnMount = false } = {}) => useQuery({
  queryKey: courseScheduleQueryKeys.course(courseId),
  queryFn: () => getCourseSchedule(courseId!),
  enabled: !!courseId,
  // Warnings depend on release dates and course dates edited elsewhere in Studio,
  // so don't trust the app-wide one-hour default.
  staleTime: SCHEDULE_STALE_MS,
  // An editor opening should refresh the cached schedule (sections may have been
  // added or moved), but still show the cached copy straight away.
  refetchOnMount: freshOnMount ? 'always' as const : true,
});

/** The timezone names for the full editor's select. Fetched once; they don't change. */
export const useTimezones = () => useQuery({
  queryKey: courseScheduleQueryKeys.timezones,
  queryFn: getTimezones,
  staleTime: Infinity,
});

export const useSaveCourseSchedule = (courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (update: ScheduleUpdate) => saveCourseSchedule(courseId, update),
    onSuccess: (data) => {
      queryClient.setQueryData(courseScheduleQueryKeys.course(courseId), data);
    },
  });
};

/**
 * Refetch the schedule whenever the outline's sections change (added, deleted,
 * renamed, moved, new release or due dates): the schedule's warnings and its
 * "N/M scheduled" count are computed from the same course content. The outline
 * lives in redux, so this watches it for changes; call it once per outline.
 */
export const useRefreshScheduleOnOutlineChange = (courseId: string) => {
  const queryClient = useQueryClient();
  const sections: any[] = useSelector(getSectionsList);
  const signature = JSON.stringify(sections.map((section) => [
    section.id,
    section.displayName,
    section.start,
    section.childInfo?.children?.map((subsection: any) => [subsection.id, subsection.due]),
  ]));
  const previous = useRef(signature);

  useEffect(() => {
    if (previous.current !== signature) {
      previous.current = signature;
      queryClient.invalidateQueries({ queryKey: courseScheduleQueryKeys.course(courseId) });
    }
  }, [signature, courseId, queryClient]);
};
