import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { apiUrl, getJson } from '@/lib/api';

import { scheduleResponseSchema } from './schema';
import type { ScheduleKind, ScheduleResponse } from './schema';

const paths: Record<ScheduleKind, string> = {
  exams: '/api/exams',
  timetable: '/api/timetable',
};

export function useSchedule(
  dept: string | null,
  kind: ScheduleKind,
): UseQueryResult<ScheduleResponse> {
  return useQuery({
    queryKey: ['schedule', kind, dept],
    queryFn: ({ signal }) =>
      getJson(
        `${paths[kind]}?dept=${encodeURIComponent(dept ?? '')}`,
        scheduleResponseSchema,
        signal,
      ),
    enabled: apiUrl !== null && dept !== null,
  });
}
